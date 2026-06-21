import { Types } from 'mongoose';
import { Task, ITask, Achievement, IAchievement, Notification } from '../models/task.model';
import { BaseService, cacheService } from './database.service';
import { startOfDay, endOfDay, addDays, isAfter, format } from 'date-fns';

// ============================================================================
// TASK SERVICE
// ============================================================================

export class TaskService extends BaseService {
  /**
   * Get tasks for a date
   */
  async getTasks(userId: string, filters: {
    date?: Date;
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<{
    date: Date;
    tasks: ITask[];
    summary: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
    };
  }> {
    try {
      const date = filters.date ? startOfDay(filters.date) : startOfDay(new Date());
      // Standardized "Today" range for timezone resilience
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      this.logger.info(`FETCHING TASKS for user ${userId} in range ${start.toISOString()} to ${end.toISOString()}`);
      
      // Query for tasks matching the date OR pending one-time tasks from the past
      const query: any = {
        userId: new Types.ObjectId(userId),
        $or: [
          // 1. Regular tasks for the specific day (Today)
          { date: { $gte: start, $lte: end } },
          // 2. ONE-TIME pending tasks from the past (display until done)
          { 
            date: { $lt: start }, 
            status: 'pending', 
            isRecurring: false 
          }
        ]
      };

      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;

      const tasks = await Task.find(query)
        .sort({ status: -1, scheduledTime: 1, date: 1 })
        .limit(filters.limit || 100);

      // Update overdue tasks for today
      const now = new Date();
      const overdueTasks = tasks.filter(t => 
        t.status === 'pending' && 
        t.scheduledTime && 
        isAfter(now, new Date(`${format(date, 'yyyy-MM-dd')}T${t.scheduledTime}`))
      );

      for (const task of overdueTasks) {
        task.status = 'overdue';
        await task.save();
      }

      const summary = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
      };

      return { date, tasks, summary };
    } catch (error) {
      this.handleError(error, 'getTasks');
    }
  }

  /**
   * Create a task
   */
  async createTask(userId: string, data: {
    title: string;
    description?: string;
    type: 'daily' | 'workout' | 'medicine' | 'appointment' | 'mental-health' | 'nutrition' | 'other';
    date?: Date;
    scheduledTime?: string;
    duration?: number;
    reminderMinutes?: number;
    isRecurring?: boolean;
    recurrencePattern?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      dayOfMonth?: number;
      endDate?: Date;
    };
    notes?: string;
    source?: 'user' | 'ai-suggested' | 'system';
    aiReasoning?: string;
  }): Promise<ITask> {
    try {
      const task = await Task.create({
        userId: new Types.ObjectId(userId),
        date: data.date ? startOfDay(data.date) : startOfDay(new Date()),
        status: 'pending',
        priority: 'medium',
        source: data.source || 'user',
        ...data
      });

      // If recurring, create future instances
      if (data.isRecurring && data.recurrencePattern) {
        await this.createRecurringTasks(userId, task, data.recurrencePattern);
      }

      this.logOperation('Task created', { userId, taskId: task._id });

      return task;
    } catch (error) {
      this.handleError(error, 'createTask');
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    userId: string,
    status: 'pending' | 'completed' | 'overdue' | 'cancelled',
    notes?: string
  ): Promise<ITask> {
    try {
      const update: any = { status };
      
      if (status === 'completed') {
        update.completedAt = new Date();
      }
      if (notes) {
        update.notes = notes;
      }

      const task = await Task.findOneAndUpdate(
        {
          _id: new Types.ObjectId(taskId),
          userId: new Types.ObjectId(userId)
        },
        { $set: update },
        { new: true }
      );

      if (!task) {
        throw new Error('Task not found');
      }

      // Check for achievements when task completed
      if (status === 'completed') {
        await this.checkTaskAchievements(userId, task);
      }

      return task;
    } catch (error) {
      this.handleError(error, 'updateTaskStatus');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    try {
      const result = await Task.deleteOne({
        _id: new Types.ObjectId(taskId),
        userId: new Types.ObjectId(userId)
      });

      if (result.deletedCount > 0) {
        this.logOperation('Task deleted', { userId, taskId });
        return true;
      }
      return false;
    } catch (error) {
      this.handleError(error, 'deleteTask');
    }
  }

  /**
   * Get upcoming tasks for notifications
   */
  async getUpcomingTasks(minutesAhead: number = 15): Promise<ITask[]> {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + minutesAhead * 60000);
      
      const today = startOfDay(now);
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const futureTimeString = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;

      const tasks = await Task.find({
        date: { $gte: today, $lt: endOfDay(today) },
        status: 'pending',
        reminderSent: false,
        scheduledTime: { $gte: timeString, $lte: futureTimeString }
      }).populate('userId', 'email fullName notificationSettings');

      return tasks;
    } catch (error) {
      this.handleError(error, 'getUpcomingTasks');
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(taskId: string): Promise<void> {
    try {
      await Task.findByIdAndUpdate(taskId, { reminderSent: true });
    } catch (error) {
      this.logger.error('Failed to mark reminder sent:', error);
    }
  }

  /**
   * Get user achievements
   */
  async getAchievements(userId: string, filters: {
    category?: string;
    isNew?: boolean;
    limit?: number;
  }): Promise<{
    achievements: IAchievement[];
    total: number;
    newCount: number;
  }> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      
      if (filters.category) query.category = filters.category;
      if (filters.isNew !== undefined) query.isNew = filters.isNew;

      const [achievements, total, newCount] = await Promise.all([
        Achievement.find(query)
          .sort({ earnedAt: -1 })
          .limit(filters.limit || 50),
        Achievement.countDocuments(query),
        Achievement.countDocuments({ userId: new Types.ObjectId(userId), isNew: true })
      ]);

      return { achievements, total, newCount };
    } catch (error) {
      this.handleError(error, 'getAchievements');
    }
  }

  /**
   * Mark achievement as viewed
   */
  async markAchievementViewed(achievementId: string, userId: string): Promise<void> {
    try {
      await Achievement.findOneAndUpdate(
        { _id: new Types.ObjectId(achievementId), userId: new Types.ObjectId(userId) },
        { isNew: false, viewedAt: new Date() }
      );
    } catch (error) {
      this.handleError(error, 'markAchievementViewed');
    }
  }

  /**
   * Create recurring task instances
   */
  private async createRecurringTasks(
    userId: string,
    parentTask: ITask,
    pattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      dayOfMonth?: number;
      endDate?: Date;
    }
  ): Promise<void> {
    try {
      const instances: any[] = [];
      let currentDate = addDays(parentTask.date, 1);
      const endDate = pattern.endDate || addDays(currentDate, 30); // Max 30 days if no end date

      while (currentDate <= endDate && instances.length < 30) {
        let shouldCreate = false;

        if (pattern.frequency === 'daily') {
          shouldCreate = true;
        } else if (pattern.frequency === 'weekly' && pattern.daysOfWeek?.includes(currentDate.getDay())) {
          shouldCreate = true;
        } else if (pattern.frequency === 'monthly' && pattern.dayOfMonth === currentDate.getDate()) {
          shouldCreate = true;
        }

        if (shouldCreate) {
          instances.push({
            userId: new Types.ObjectId(userId),
            parentTaskId: parentTask._id,
            title: parentTask.title,
            description: parentTask.description,
            type: parentTask.type,
            date: currentDate,
            scheduledTime: parentTask.scheduledTime,
            duration: parentTask.duration,
            reminderMinutes: parentTask.reminderMinutes,
            status: 'pending',
            priority: parentTask.priority,
            source: parentTask.source,
            isRecurring: false // Instances are not recurring themselves
          });
        }

        currentDate = addDays(currentDate, 1);
      }

      if (instances.length > 0) {
        await Task.insertMany(instances);
      }
    } catch (error) {
      this.logger.error('Failed to create recurring tasks:', error);
    }
  }

  /**
   * Check and award task-related achievements
   */
  private async checkTaskAchievements(userId: string, completedTask: ITask): Promise<void> {
    try {
      // Count completed tasks today
      const today = startOfDay(new Date());
      const completedToday = await Task.countDocuments({
        userId: new Types.ObjectId(userId),
        status: 'completed',
        completedAt: { $gte: today }
      });

      // Count total completed tasks
      const totalCompleted = await Task.countDocuments({
        userId: new Types.ObjectId(userId),
        status: 'completed'
      });

      // Check for achievements
      const achievementsToCheck = [
        { type: 'first-task', title: 'Getting Started', description: 'Complete your first task', category: 'general', tier: 'bronze', threshold: 1 },
        { type: 'task-streak-3', title: 'On a Roll', description: 'Complete 3 tasks in a day', category: 'general', tier: 'bronze', threshold: 3 },
        { type: 'task-streak-5', title: 'Productivity Pro', description: 'Complete 5 tasks in a day', category: 'general', tier: 'silver', threshold: 5 },
        { type: 'task-master-50', title: 'Task Master', description: 'Complete 50 tasks total', category: 'general', tier: 'silver', threshold: 50 },
        { type: 'task-master-100', title: 'Century Club', description: 'Complete 100 tasks total', category: 'general', tier: 'gold', threshold: 100 }
      ];

      for (const achievement of achievementsToCheck) {
        const alreadyEarned = await Achievement.findOne({
          userId: new Types.ObjectId(userId),
          type: achievement.type
        });

        if (!alreadyEarned) {
          const threshold = achievement.type.includes('streak') ? completedToday : totalCompleted;
          
          if (threshold >= achievement.threshold) {
            await Achievement.create({
              userId: new Types.ObjectId(userId),
              type: achievement.type,
              title: achievement.title,
              description: achievement.description,
              icon: this.getAchievementIcon(achievement.type),
              category: achievement.category as any,
              tier: achievement.tier as any,
              earnedAt: new Date(),
              criteria: {
                metric: 'tasks_completed',
                threshold: achievement.threshold,
                timeFrame: achievement.type.includes('streak') ? 'daily' : 'total'
              },
              isNew: true
            });

            // Create notification
            await Notification.create({
              userId: new Types.ObjectId(userId),
              type: 'achievement',
              title: `Achievement Unlocked: ${achievement.title}`,
              message: achievement.description,
              priority: 'medium',
              status: 'unread'
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to check task achievements:', error);
    }
  }

  private getAchievementIcon(type: string): string {
    const icons: Record<string, string> = {
      'first-task': 'star',
      'task-streak-3': 'zap',
      'task-streak-5': 'trending-up',
      'task-master-50': 'award',
      'task-master-100': 'crown'
    };
    return icons[type] || 'star';
  }

  /**
   * Toggle a subtask's completion status
   */
  async updateSubtaskStatus(
    taskId: string,
    userId: string,
    subtaskId: string,
    completed: boolean
  ): Promise<ITask> {
    try {
      const task = await Task.findOneAndUpdate(
        {
          _id: new Types.ObjectId(taskId),
          userId: new Types.ObjectId(userId),
          "subtasks.id": subtaskId
        },
        {
          $set: { "subtasks.$.completed": completed }
        },
        { new: true }
      );

      if (!task) {
        throw new Error('Task or Subtask not found');
      }

      return task;
    } catch (error) {
      this.handleError(error, 'updateSubtaskStatus');
    }
  }
}

export const taskService = new TaskService();
