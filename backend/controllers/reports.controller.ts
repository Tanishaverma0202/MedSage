import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { aiService } from '../services/ai.service';
import { vectorService } from '../services/vector.service';
import { AuthRequest, validateRequest } from '../middleware/common.middleware';
import { Report } from '../models/report.model';
import PDFDocument from 'pdfkit';
import { logger } from '../services/database.service';
import { Types } from 'mongoose';
import { extractTextFromPDF } from '../utils/pdf-parser.util';
import path from 'path';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const analyzeReportValidation = [
  body('fileData')
    .notEmpty()
    .withMessage('File data is required'),
  body('mimeType')
    .notEmpty()
    .withMessage('MIME type is required'),
  body('filename')
    .notEmpty()
    .withMessage('Filename is required')
];

// ============================================================================
// REPORTS CONTROLLER
// ============================================================================

export const reportsController = {
  /**
   * Upload and Save medical report (Initial Step)
   */
  uploadReport: [
    ...analyzeReportValidation,
    validateRequest,
    async (req: AuthRequest, res: Response) => {
      try {
        const { fileData, mimeType, filename } = req.body;
        const userId = req.user?.userId;

        const report = await Report.create({
          userId: new Types.ObjectId(userId),
          filename,
          mimeType,
          fileData,
          status: 'pending'
        });

        res.status(201).json({
          success: true,
          data: {
            _id: report._id,
            filename: report.filename,
            mimeType: report.mimeType,
            status: report.status,
            createdAt: report.createdAt
          }
        });
      } catch (error: any) {
        logger.error('Error uploading report:', error);
        res.status(500).json({ success: false, error: 'Failed to upload report' });
      }
    }
  ],

  /**
   * Analyze an already uploaded report
   */
  analyzeReport: async (req: AuthRequest, res: Response) => {
    let report: any = null;

    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // 1. Fetch report with fileData (which is hidden by default)
      report = await Report.findOne({ _id: id, userId }).select('+fileData');
      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      const { fileData, mimeType, filename } = report;
      if (!fileData) {
        return res.status(400).json({ success: false, error: 'Report file data is missing' });
      }

      let analysisPrompt = '';
      let aiContext: any = {
        injectRAG: true,
        userId: userId,
        ragModule: 'reports',
        maxTokens: 2048,
        temperature: 0.1,
        format: 'json'
      };

      // Handle PDF Text Extraction
      if (mimeType === 'application/pdf') {
        try {
          logger.info(`📄 Extracting text from PDF for analysis: ${filename}`);
          const buffer = Buffer.from(fileData, 'base64');
          const extractedText = await extractTextFromPDF(buffer);
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error('PDF contains too little text for analysis. It might be a scanned image.');
          }

          analysisPrompt = `Extracted Text from Medical Report (${filename}):\n\n${extractedText}\n\n---\nAnalyze the above medical data.`;
        } catch (pdfError: any) {
          logger.warn('PDF text extraction failed, falling back to vision:', pdfError.message);
          aiContext.imageData = fileData;
          aiContext.mimeType = mimeType;
          analysisPrompt = `Analyze this medical report document: ${filename}`;
        }
      } else {
        // It's an image
        aiContext.imageData = fileData;
        aiContext.mimeType = mimeType;
        analysisPrompt = `Analyze this medical report image: ${filename}`;
      }

      const prompt = `You are an expert Medical Report Analyst. ${analysisPrompt}
      
      INSTRUCTIONS:
      Output ONLY a pure JSON object using this EXACT structure:
      {
        "summary": "Clear, simplified explanation of the report",
        "metrics": [{"name": "e.g. Glucose", "value": "e.g. 110 mg/dL", "status": "Normal/Low/High"}],
        "alerts": [{"detail": "Brief alert detail", "severity": "Low/Moderate/High"}],
        "trends": "A short synthesis of how this compares to past history",
        "strengths": ["List of positive health indicators"],
        "concerns": ["List of areas needing attention"],
        "recommendations": {
          "diet": ["Precise dietary advice"],
          "workout": ["Specific exercise modification"],
          "lifestyle": ["Habit change"],
          "mentalWellness": ["Mental health support"]
        }
      }
      
      CRITICAL: Use ONLY the keys exactly as shown above.`;

      // Inject RAG memory dynamically into the analysis
      const result = await aiService.generateText(prompt, aiContext);

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI analysis failed to return content. Please try again.');
      }

      let parsedData = (aiService as any).parseJSONResponse(result.text);

      if (!parsedData) {
        const rawText = result.text.trim();
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsedData = JSON.parse(match[0]);
            } catch {
              parsedData = null;
            }
          }
        }
      }

      const normalizeAnalysis = (data: any) => ({
        summary: String(data?.summary || '').trim(),
        metrics: Array.isArray(data?.metrics)
          ? data.metrics.map((m: any) => ({
              name: String(m?.name || '').trim(),
              value: String(m?.value || '').trim(),
              status: ['Normal', 'Low', 'High'].includes(m?.status) ? m.status : 'Normal'
            }))
          : [],
        alerts: Array.isArray(data?.alerts)
          ? data.alerts.map((a: any) => ({
              detail: String(a?.detail || '').trim(),
              severity: ['Low', 'Moderate', 'High'].includes(a?.severity) ? a.severity : 'Low'
            }))
          : [],
        trends: String(data?.trends || '').trim(),
        strengths: Array.isArray(data?.strengths) ? data.strengths.map(String) : [],
        concerns: Array.isArray(data?.concerns) ? data.concerns.map(String) : [],
        recommendations: {
          diet: Array.isArray(data?.recommendations?.diet) ? data.recommendations.diet.map(String) : [],
          workout: Array.isArray(data?.recommendations?.workout) ? data.recommendations.workout.map(String) : [],
          lifestyle: Array.isArray(data?.recommendations?.lifestyle) ? data.recommendations.lifestyle.map(String) : [],
          mentalWellness: Array.isArray(data?.recommendations?.mentalWellness) ? data.recommendations.mentalWellness.map(String) : []
        }
      });

      const normalizedData = normalizeAnalysis(parsedData);

      if (!normalizedData.summary) {
        throw new Error('Failed to parse AI response into clinical insights.');
      }

      // Update Report in DB
      report.analysis = normalizedData;
      report.status = 'completed';
      report.analyzedAt = new Date();
      await report.save();

      // Clear old memories for this specific report if re-analyzing
      await vectorService.deleteMemoryByMetadata(userId as string, { reportId: report._id });

      // Add fresh insights to RAG Memory
      await vectorService.storeMemory(
        userId as string,
        `Medical Report (${filename}): ${normalizedData.summary}. Key alerts: ${normalizedData.alerts.map((a: any) => a.detail).join(', ')}.`,
        'reports',
        { reportId: report._id }
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      logger.error('Error in analyzeReport:', error);
      if (report) {
        try {
          report.status = 'failed';
          await report.save();
        } catch (saveError) {
          logger.error('Failed to update report status after analysis error:', saveError);
        }
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Report analysis failed'
      });
    }
  },

  /**
   * Get user's reports
   */
  getReports: async (req: AuthRequest, res: Response) => {
    try {
      const reports = await Report.find({ userId: req.user?.userId })
        .sort({ createdAt: -1 })
        .select('-fileData');

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }
  },

  /**
   * Delete a report
   */
  deleteReport: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await Report.findOneAndDelete({ _id: id, userId: req.user?.userId });
      res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete report' });
    }
  },

  /**
   * Generate and download PDF analysis
   */
  downloadReportPDF: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const report = await Report.findOne({ _id: id, userId: req.user?.userId });

      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      const doc = new PDFDocument({ margin: 50 });
      let filename = `MedSage_Analysis_${report.filename.replace(/[^a-z0-9]/gi, '_')}.pdf`;

      filename = encodeURIComponent(filename);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // Header
      doc.fontSize(25).text('MedSage Health Report Analysis', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.text(`File: ${report.filename}`, { align: 'right' });
      doc.moveDown(2);

      // Analysis Section
      doc.fontSize(16).fillColor('#2c3e50').text('AI Summary & Key Findings', { underline: true });
      doc.moveDown();
      doc.fontSize(11).fillColor('#000000').text(report.analysis.summary, {
        align: 'justify',
        lineGap: 5
      });
      
      doc.moveDown();
      doc.fontSize(14).fillColor('#2c3e50').text('Trend Analysis', { underline: true });
      doc.moveDown();
      doc.fontSize(11).fillColor('#000000').text(report.analysis.trends || 'No trends available.', {
        align: 'justify',
        lineGap: 5
      });

      if (report.analysis.alerts && report.analysis.alerts.length > 0) {
        doc.moveDown();
        doc.fontSize(14).fillColor('#c0392b').text('Alerts & Risks', { underline: true });
        doc.moveDown();
        report.analysis.alerts.forEach((alert: any) => {
           doc.fontSize(11).fillColor('#c0392b').text(`• [${alert.severity}] ${alert.detail}`);
        });
      }

      doc.moveDown(2);
      doc.fontSize(10).fillColor('#7f8c8d').text('Disclaimer: This analysis is generated by AI for informational purposes only. It is not a professional medical diagnosis. Consult with a qualified physician for any health concerns.', {
        align: 'center'
      });

      doc.end();
    } catch (error) {
      logger.error('PDF generation error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
  }
};
