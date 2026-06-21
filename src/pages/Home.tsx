import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Brain, Droplet, Moon, Utensils, AlertCircle,
  CheckCircle2, Circle, X, Loader2, RefreshCw,
  Heart, Trash2, MessageCircle, ThumbsUp, Plus, Send,
  ChevronDown, ChevronUp, Users, Sparkles, BookOpen,
  Dumbbell, Apple, Smile, Zap
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '@/lib/utils';
import { calculateHealthScore, type HealthScoreResult, type ProfileData } from '@/utils/healthScore';
import { apiCall, API_ENDPOINTS } from '@/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Insight { title?: string; message: string; category?: string; }
interface Alert { severity: string; message: string; }
interface TrendPoint { day: string; score: number; }
interface Metrics {
  sleep: string | null; activity: string; nutrition: string;
  mental: string; hormones: string; workouts: number;
  hydration?: string;
}
interface Dashboard {
  score: number;
  status: string;
  summary: string;
  insights: Insight[];
  alerts: Alert[];
  weeklyTrend: TrendPoint[];
  metrics: Metrics;
  profile: { name?: string; goals?: string };
}

type DiscussionCategory = 'all' | 'nutrition' | 'workout' | 'mental-health' | 'hormones' | 'sleep' | 'general';

interface Reply { _id: string; anonAlias: string; content: string; likes: number; createdAt: string; }
interface Discussion {
  _id: string;
  anonAlias: string;
  category: string;
  title: string;
  content: string;
  likes: number;
  hasLiked: boolean;
  replies: Reply[];
  createdAt: string;
}

// ── Static health blog posts ──────────────────────────────────────────────────

const BLOG_POSTS = [
  {
    id: 'b1',
    category: 'nutrition',
    title: 'Why Protein at Breakfast Changes Everything',
    summary: 'Studies from Harvard Medical School show that 30g of protein in your first meal stabilizes blood sugar for 6+ hours, reducing cravings by up to 60%.',
    content: [
      'Starting your day with a high-protein breakfast is one of the most effective strategies for metabolic health and appetite regulation. Research from Harvard Medical School and other leading institutions highlights that consuming 30 grams of protein during your first meal stabilizes blood glucose levels and prevents the insulin spikes often caused by carb-heavy breakfasts.',
      'This blood sugar stability has a direct impact on the brain\'s satiety centers. By keeping insulin steady, a protein-rich meal keeps hunger hormones like ghrelin suppressed, which reduces cravings for sugary snacks later in the day by up to 60%.',
      'Ideal breakfast protein sources include eggs, Greek yogurt, cottage cheese, smoked salmon, or a high-quality whey or plant-based protein shake. Pairing these with healthy fats and fiber (like avocado and spinach) creates an optimal slow-burning fuel source that keeps you focused and energized until lunch.',
      '"The single most impactful nutritional change for most people is simply shifting breakfast from carb-dominant to protein-dominant. The metabolic downstream effects are profound." — Dr. David Ludwig, Harvard School of Public Health',
      'Practically, aim to build your breakfast around at least one of: 3 whole eggs (18g protein), a cup of Greek yogurt (17g), half a cup of cottage cheese (14g), or a protein shake mixed with nut butter. The goal is 30g minimum, which may feel like a lot initially but becomes effortless with practice.',
      'Long-term adherence to a protein-first breakfast strategy has also been shown to improve lean muscle mass and resting metabolic rate, creating a compounding advantage for those seeking sustainable weight management.'
    ],
    readTime: '5 min',
    emoji: '🥚',
    tag: 'Nutrition Science',
    tagColor: 'bg-emerald-100 text-emerald-700',
    source: 'Harvard Health'
  },
  {
    id: 'b2',
    category: 'sleep',
    title: 'The 90-Minute Sleep Cycle Hack',
    summary: 'Waking up mid-cycle causes grogginess. Time your alarm to multiples of 90 minutes from sleep onset — 7.5h or 9h — to feel naturally refreshed.',
    content: [
      'Have you ever slept for nine hours only to wake up feeling exhausted, but felt completely alert after sleeping for only six? The secret lies in sleep cycles rather than the total number of hours.',
      'Human sleep is structured in cycles that last approximately 90 minutes. During this time, the brain moves through light sleep, deep sleep, and REM (dream) sleep. Waking up in the middle of deep sleep results in sleep inertia — that groggy, disoriented feeling that can last for hours.',
      'To wake up naturally refreshed, aim to wake up at the end of a cycle. Plan your sleep duration in multiples of 90 minutes. For instance, aiming for 7.5 hours (5 cycles) or 9 hours (6 cycles) of sleep can make waking up significantly easier. Remember to factor in an extra 15 minutes to fall asleep when setting your alarm.',
      '"Timing your wake-up to align with the end of a sleep cycle is one of the most underrated sleep hacks. The research on sleep inertia is unequivocal — mid-cycle waking is deeply disruptive to cognitive function." — Sleep Foundation',
      'Using apps like Sleep Cycle that monitor your movement to wake you at the lightest phase of sleep, or calculating your ideal wake time using the sleepyti.me calculator, can take the guesswork out of cycle timing.',
      'Consistent sleep and wake times — even on weekends — also help anchor your biological clock, making the end-of-cycle wake strategy even more effective over time.'
    ],
    readTime: '4 min',
    emoji: '🌙',
    tag: 'Sleep Science',
    tagColor: 'bg-indigo-100 text-indigo-700',
    source: 'Sleep Foundation'
  },
  {
    id: 'b3',
    category: 'workout',
    title: 'Zone 2 Cardio: The Longevity Secret',
    summary: 'Cardiologist Peter Attia argues Zone 2 training (conversational pace) builds mitochondrial density and is the single best longevity investment — 3x/week for 45 min.',
    content: [
      'In the fitness and medical world, Zone 2 cardiovascular training has emerged as a cornerstone of longevity and metabolic health. Zone 2 corresponds to a conversational pace — an intensity where you can still speak in full sentences, but it requires some effort.',
      'At this intensity, your muscles rely almost entirely on fat oxidation for fuel, which stimulates the growth and efficiency of mitochondria (the powerhouses of your cells). Building mitochondrial density reverses age-related decline and dramatically improves insulin sensitivity.',
      'Leading experts, including Dr. Peter Attia, recommend dedicating 150 to 200 minutes per week to Zone 2 cardio, broken down into sessions of 45 to 60 minutes. Running, cycling, rowing, or even brisk incline walking are excellent ways to achieve this metabolic sweet spot.',
      '"Zone 2 training is not sexy, but the science is clear — it is the single highest-return investment you can make in your long-term health and cardiovascular resilience." — Dr. Peter Attia, Outlive',
      'To find your Zone 2 heart rate, use the formula 180 minus your age. For a 30-year-old, that is 150 BPM. Alternatively, use the "talk test" — you should be able to hold a conversation, but singing would be difficult. A heart rate monitor makes precision easy.',
      'Studies from the Inigo San Millán laboratory at the University of Colorado show that elite cyclists and the healthiest centenarians share one striking trait: extraordinarily high Zone 2 training volume accumulated over decades.'
    ],
    readTime: '6 min',
    emoji: '🏃‍♀️',
    tag: 'Fitness Research',
    tagColor: 'bg-orange-100 text-orange-700',
    source: 'Peter Attia MD'
  },
  {
    id: 'b4',
    category: 'mental-health',
    title: 'Box Breathing: Navy SEAL Stress Reset',
    summary: '4-4-4-4 box breathing activates the parasympathetic nervous system in under 2 minutes. Cortisol drops measurably — verified by the US Navy and Stanford.',
    content: [
      'When stress hits, your sympathetic nervous system takes over, triggering a fight-or-flight response. Your heart rate rises, shallow breathing begins, and cortisol floods your bloodstream. Fortunately, you can override this system in under 2 minutes using Box Breathing.',
      'Box Breathing is a simple technique popularized by Navy SEALs to stay calm under extreme pressure. It works by sending direct biological signals to the vagus nerve to activate the parasympathetic (rest-and-digest) system, slowing your heart rate and reducing blood pressure.',
      'The method is simple: Inhale through the nose for 4 seconds, hold your breath for 4 seconds, exhale slowly through the mouth for 4 seconds, and hold empty for 4 seconds. Repeat this cycle four times.',
      '"Box breathing is one of the most evidence-backed breathing techniques for rapidly downregulating the stress response. Even a single round produces measurable physiological changes." — Dr. Andrew Huberman, Stanford Neuroscience',
      'Stanford researchers have verified that this pattern rapidly lowers cortisol and restores emotional control. During the exhale phase specifically, the vagus nerve is stimulated most strongly, producing the calming effect.',
      'Practice box breathing proactively — before stressful events, not only during them — to prime your nervous system and build a stronger baseline stress resilience over time.'
    ],
    readTime: '4 min',
    emoji: '🧘‍♀️',
    tag: 'Mental Wellness',
    tagColor: 'bg-purple-100 text-purple-700',
    source: 'Stanford Medicine'
  },
  {
    id: 'b5',
    category: 'hormones',
    title: 'Seed Cycling for Hormonal Balance',
    summary: 'Flaxseeds & pumpkin seeds in the follicular phase, sunflower & sesame in the luteal phase — this nutrition protocol shows promising results in small-scale hormonal studies.',
    content: [
      'Seed cycling is a gentle, food-based protocol designed to support healthy estrogen and progesterone levels throughout the menstrual cycle. It involves consuming specific seeds during different phases of your cycle to supply the body with the precursors needed for hormone synthesis.',
      'During the Follicular Phase (Days 1-14, from period start to ovulation), the goal is to balance estrogen. Consuming 1 tablespoon each of raw, ground flaxseeds and pumpkin seeds daily provides lignans (which bind excess estrogen) and zinc (which supports progesterone production).',
      'During the Luteal Phase (Days 15-28, from ovulation to the next period), the goal is to support progesterone. Consuming 1 tablespoon each of raw, ground sunflower seeds and sesame seeds daily provides selenium and vitamin E (both vital for corpus luteum function and progesterone synthesis).',
      '"While formal large-scale RCTs are still needed, the micronutrient logic behind seed cycling is sound — each seed provides specific minerals and fatty acids that support distinct hormonal pathways." — Integrative Medicine Journal',
      'To begin seed cycling, track your cycle to identify your current phase. Grind seeds fresh (a small coffee grinder works perfectly) to maximize bioavailability of the lignans and fatty acids. Add them to smoothies, oatmeal, yogurt, or salads.',
      'Many women report improvements in PMS symptoms, cycle regularity, and overall energy levels within 2-3 months of consistent seed cycling, though individual results vary significantly based on underlying hormonal status.'
    ],
    readTime: '5 min',
    emoji: '🌸',
    tag: 'Hormonal Health',
    tagColor: 'bg-pink-100 text-pink-700',
    source: 'Integrative Medicine'
  },
  {
    id: 'b6',
    category: 'nutrition',
    title: 'The Gut-Brain Axis: You Are What You Eat',
    summary: '95% of serotonin is produced in the gut. A diverse microbiome (30+ plant varieties/week) directly correlates with lower anxiety and better mood regulation.',
    content: [
      'The connection between the gut and the brain is so strong that scientists often refer to the gut as the \'second brain.\' The gut-brain axis is a bidirectional communication network linked by the vagus nerve, hormones, and neurotransmitters.',
      'Remarkably, about 95% of the body\'s serotonin — the key neurotransmitter responsible for mood stabilization and feelings of well-being — is produced in the gut by intestinal microbes. When the gut microbiome is out of balance, neurotransmitter production suffers, which can trigger or exacerbate anxiety and depression.',
      'To cultivate a healthy gut microbiome, focus on dietary diversity. Aim to consume at least 30 different plant varieties per week (including vegetables, fruits, grains, nuts, and seeds) and include fermented foods like kefir, kimchi, and live yogurt to introduce beneficial bacterial strains.',
      '"The human gut microbiome has 100 trillion microorganisms that collectively weigh as much as the brain. The metabolites they produce have profound effects on cognition, mood, and systemic inflammation." — Nature Reviews Gastroenterology',
      'The American Gut Project, one of the largest citizen-science microbiome studies, found that participants who ate 30 or more different plant foods per week had significantly more diverse microbiomes than those who ate 10 or fewer.',
      'Practical tips: keep a weekly plant tally, rotate your salad greens, try a new vegetable each week, and use mixed grain mixes instead of single grains. Diversity, not quantity, is the key metric.'
    ],
    readTime: '7 min',
    emoji: '🫀',
    tag: 'Gut Health',
    tagColor: 'bg-teal-100 text-teal-700',
    source: 'Nature Reviews'
  },
  {
    id: 'b7',
    category: 'sleep',
    title: 'The Sleep Inertia Solution',
    summary: 'Sleep inertia is the physiological state of transition from sleep to waking. Light, hydration, and movement can clear adenosine and wake you up in 10 minutes.',
    content: [
      'Waking up feeling groggy, heavy-headed, and desperate for coffee is a common experience known as sleep inertia. This state is caused by residual adenosine (the sleep-drive chemical) in the brain, along with cold body temperatures and dehydration from hours of sleep.',
      'To clear sleep inertia rapidly, you must target the three main biological wake-up signals: light, hydration, and movement. First, get bright light (ideally sunlight) in your eyes within 10 minutes of waking. This suppresses melatonin and triggers a natural cortisol morning spike.',
      'Next, drink a large glass of water immediately to rehydrate your brain and organs, which boosts cognitive function. Finally, engage in 5 minutes of light movement, like stretching or walking, to raise your core body temperature and circulate oxygen.',
      '"The morning cortisol surge, triggered by light exposure, is the single most powerful natural wake signal available to us. It completely overrides sleep inertia when timed correctly." — Dr. Andrew Huberman',
      'Avoid hitting snooze — interrupted sleep creates micro-arousals that deposit additional adenosine rather than clearing it, leaving you feeling worse after each snooze cycle.',
      'Delaying caffeine by 90-120 minutes after waking also helps clear adenosine naturally first, making the caffeine significantly more effective when you do consume it and reducing the afternoon energy crash.'
    ],
    readTime: '4 min',
    emoji: '⏰',
    tag: 'Sleep Science',
    tagColor: 'bg-indigo-100 text-indigo-700',
    source: 'Harvard Health'
  },
  {
    id: 'b8',
    category: 'nutrition',
    title: 'Intermittent Fasting: Autophagy & Longevity Science',
    summary: 'Restricting eating windows triggers autophagy — the cellular cleanup process where cells recycle damaged parts, reducing inflammation and improving metabolic age.',
    content: [
      'Intermittent fasting has transitioned from a fitness trend to a scientifically validated tool for longevity and cellular rejuvenation. By restricting your eating to an 8-hour window (e.g., 12 PM to 8 PM) and fasting for the remaining 16 hours, you shift your body\'s energy balance.',
      'During the fasting window, insulin levels drop significantly, forcing the body to burn fat for fuel. More importantly, fasting triggers a process called autophagy. Autophagy is the cell\'s natural recycling system, where it breaks down and clears out damaged proteins, dysfunctional mitochondria, and cellular waste.',
      'Autophagy helps reduce systemic inflammation, improves cardiovascular markers, and enhances brain health by stimulating BDNF (Brain-Derived Neurotrophic Factor). To start, try a mild 14:10 window and gradually adjust to a 16:8 schedule.',
      '"Autophagy is the body\'s most powerful self-repair mechanism. Fasting is its most reliable activator. The Nobel Prize in Physiology 2016 was awarded specifically for the discovery of autophagy and its mechanisms." — Nobel Committee Summary',
      'Important considerations: women may be more sensitive to extended fasting protocols. If you experience hormonal irregularities, consider a gentler 13:11 window. Always break your fast with protein and fiber to prevent blood sugar spikes.',
      'The metabolic benefits of fasting are compounded when combined with a diet rich in polyphenols (berries, dark chocolate, green tea), which further activate AMPK and SIRT1 — the same longevity pathways triggered by fasting.'
    ],
    readTime: '6 min',
    emoji: '⏳',
    tag: 'Nutrition Science',
    tagColor: 'bg-emerald-100 text-emerald-700',
    source: 'Cell Metabolism'
  },
  {
    id: 'b9',
    category: 'workout',
    title: 'HIIT vs LISS: Choosing the Right Cardio for You',
    summary: 'High-Intensity Interval Training burns quick calories, while Low-Intensity Steady State cardio builds long-term metabolic health. Here is how to balance both.',
    content: [
      'When planning cardio workouts, the debate often centers on HIIT (High-Intensity Interval Training) versus LISS (Low-Intensity Steady-State cardio). Both offer unique advantages, and understanding their physiological impacts helps you customize your training.',
      'HIIT involves short, intense bursts of exercise followed by active recovery. It is highly time-efficient, burning significant calories in 15-20 minutes, and triggers the afterburn effect (EPOC), keeping your metabolism elevated for hours post-workout.',
      'LISS, on the other hand, involves continuous moderate exercise (like walking or cycling) for 45-60 minutes. It is easier on the joints, builds aerobic endurance, and utilizes fat as its primary fuel source without raising cortisol significantly.',
      '"Recovery is where adaptation happens. Programming too much HIIT without LISS support leads to a maladaptive stress response — the opposite of what athletes intend." — Medicine & Science in Sports & Exercise',
      'For a balanced routine, incorporate 2-3 LISS sessions per week for heart health and 1-2 HIIT sessions for cardiovascular capacity and power. Beginners should start with 100% LISS for the first 4-6 weeks to build a base.',
      'Track your Heart Rate Variability (HRV) to gauge recovery. A declining HRV trend over multiple days is a clear signal to prioritize LISS over HIIT, regardless of your planned schedule.'
    ],
    readTime: '5 min',
    emoji: '🚴‍♂️',
    tag: 'Fitness Research',
    tagColor: 'bg-orange-100 text-orange-700',
    source: 'Medicine & Science in Sports'
  },
  {
    id: 'b10',
    category: 'mental-health',
    title: 'Neuroplasticity: Rewiring Your Brain for Joy',
    summary: 'The brain is not hardwired. Engaging in deliberate learning, mindfulness, and positive habit loop repetition physically alters neural pathways to improve mental health.',
    content: [
      'For decades, scientists believed the adult brain was fixed and unchangeable. Today, we know that the brain possesses neuroplasticity — the ability to physically restructure and adapt its neural pathways in response to learning, environment, and conscious habits.',
      'Every time you practice a new skill, think a positive thought, or choose a new habit, you strengthen the synaptic connections associated with that action. Conversely, pathways that are ignored begin to weaken. This means you can actively train your brain toward resilience and focus.',
      'To harness neuroplasticity, challenge your brain with novel experiences like learning a language or instrument, practice daily mindfulness to reduce reactivity in the amygdala, and consciously interrupt negative thought loops by reframing them with realistic, positive outcomes.',
      '"Neurons that fire together, wire together. Every deliberate positive thought or action literally sculpts a new architecture in your brain." — Dr. Rick Hanson, Hardwiring Happiness',
      'Aerobic exercise is one of the most potent neuroplasticity triggers available. A 2011 Harvard study found that regular aerobic exercise increases hippocampal volume by 2% per year — effectively reversing the age-related shrinkage of the memory center.',
      'Combine learning with movement (listen to a language lesson while walking), and sleep enough to consolidate new neural connections — the brain does most of its structural rewiring during deep sleep.'
    ],
    readTime: '6 min',
    emoji: '🧠',
    tag: 'Mental Wellness',
    tagColor: 'bg-purple-100 text-purple-700',
    source: 'Harvard Neuro'
  },
  {
    id: 'b11',
    category: 'hormones',
    title: 'Understanding Cortisol: Stress, Energy & Your Clock',
    summary: 'Cortisol is not just a stress hormone. It regulates your immune response, blood pressure, and circadian rhythm. Learn how to manage it for sustained energy.',
    content: [
      'Cortisol is commonly labeled as the \'stress hormone,\' but its role in the human body is far more comprehensive. Produced by the adrenal glands, cortisol helps regulate blood pressure, immune function, glucose metabolism, and your sleep-wake cycle.',
      'In a healthy state, cortisol levels peak in the morning (providing energy and focus to start the day) and drop to their lowest point at night to facilitate deep sleep. However, chronic stress keeps cortisol levels elevated around the clock, leading to fatigue, weight gain, brain fog, and compromised immunity.',
      'High cortisol also suppresses progesterone and disrupts the HPG (Hypothalamic-Pituitary-Gonadal) axis, making it a direct contributor to menstrual irregularities, low libido, and fertility challenges in both sexes.',
      '"Cortisol is like a financial loan — helpful in an emergency, but a disaster if you are carrying it chronically. The compounding interest cost shows up as systemic inflammation and hormonal collapse." — Dr. Sara Gottfried',
      'To restore a healthy cortisol curve, prioritize morning sunlight to align your circadian clock, limit caffeine after 2 PM to protect evening sleep, and adopt stress-reduction habits like meditation or walking in nature.',
      'Adaptogenic herbs like ashwagandha (KSM-66) have shown in multiple double-blind trials to reduce serum cortisol levels by 15-30% in chronically stressed individuals — making them a useful adjunct to lifestyle interventions.'
    ],
    readTime: '5 min',
    emoji: '📈',
    tag: 'Hormonal Health',
    tagColor: 'bg-pink-100 text-pink-700',
    source: 'Endocrine Society'
  },
  {
    id: 'b12',
    category: 'nutrition',
    title: 'The Magnesium Guide: Which Form is Best for You?',
    summary: 'Over 50% of adults are magnesium-deficient. Learn the differences between Glycinate (sleep), Citrate (digestion), and L-Threonate (cognitive function).',
    content: [
      'Magnesium is a vital mineral involved in over 300 biochemical reactions in the body, including muscle function, nerve transmission, and energy production. Yet, due to soil depletion and processed diets, over 50% of adults do not meet their daily magnesium requirements.',
      'When supplementing, the form of magnesium matters because different compounds target different systems. Magnesium Glycinate is highly bioavailable and bound to glycine, making it excellent for promoting relaxation, reducing anxiety, and improving sleep quality.',
      'Magnesium Citrate is commonly used to support digestive health and relieve constipation, while Magnesium L-Threonate is the only form known to readily cross the blood-brain barrier, making it the preferred choice for boosting memory and cognitive longevity.',
      '"Magnesium deficiency is the silent epidemic of the modern era. Most people cannot get adequate amounts from diet alone due to food processing and soil depletion." — PubMed Health, 2023',
      'Food sources of magnesium include dark leafy greens (spinach has 157mg per cooked cup), pumpkin seeds (156mg per ounce), dark chocolate (64mg per ounce), and almonds (80mg per ounce). Combine food and supplementation for optimal levels.',
      'Target 350-400mg daily for adult women and 400-420mg for adult men. Have your serum magnesium tested if you experience frequent muscle cramps, poor sleep, or anxiety — these are hallmark deficiency symptoms.'
    ],
    readTime: '5 min',
    emoji: '💊',
    tag: 'Nutrition Science',
    tagColor: 'bg-emerald-100 text-emerald-700',
    source: 'PubMed Health'
  },
  {
    id: 'b13',
    category: 'sleep',
    title: 'Circadian Biology: Syncing Your Body to the Sun',
    summary: 'Every cell in your body has a circadian clock. Aligning your eating, sleeping, and light exposure with natural cycles optimizes hormone release and energy.',
    content: [
      'Circadian biology studies the natural 24-hour cycles that govern almost every physiological process in our bodies. Every organ and cell contains a clock gene, synchronized by a master clock in the brain (the suprachiasmatic nucleus) which is highly sensitive to light.',
      'When your daily routines align with natural daylight patterns, your body works in harmony. Hormones like cortisol and insulin release at optimal times for activity and digestion, and melatonin rises in the evening to prepare you for deep, restorative sleep.',
      'To sync your circadian rhythm, get 10-15 minutes of outdoor light first thing in the morning, maintain consistent sleep and wake times even on weekends, and avoid bright blue light from screens and overhead lights for 2 hours before bed.',
      '"Circadian misalignment is now recognized as a major driver of metabolic syndrome, obesity, depression, and cancer risk. The clock is not a metaphor — it is a precise molecular machine." — Salk Institute for Biological Studies',
      'Time-Restricted Eating (TRE) is the dietary application of circadian biology — by eating all your calories within daylight hours, you align food intake with peak insulin sensitivity and digestive function, improving metabolic markers even without caloric restriction.',
      'The 2017 Nobel Prize in Physiology or Medicine was awarded for the discovery of the molecular mechanisms controlling circadian rhythms, cementing their role in virtually every aspect of human health.'
    ],
    readTime: '6 min',
    emoji: '☀️',
    tag: 'Sleep Science',
    tagColor: 'bg-indigo-100 text-indigo-700',
    source: 'Salk Institute'
  },
  {
    id: 'b14',
    category: 'hormones',
    title: 'Menstrual Synchronization: Myth or Biological Reality?',
    summary: 'The idea that women who live together align their menstrual cycles is a popular belief. Let\'s look at the mathematical and evolutionary science behind it.',
    content: [
      'The belief that women who live together eventually align their menstrual cycles is widely accepted and often referred to as the McClintock Effect. Named after researcher Martha McClintock, a 1971 study suggested that pheromones could cause cycle synchronization.',
      'However, subsequent large-scale scientific studies and mathematical models have debunked this as a myth. Because menstrual cycles vary in length from month to month (typically 21 to 35 days), cycle overlaps are bound to occur by pure statistical probability.',
      'Modern evolutionary biologists argue that cycle synchronization would actually create reproductive competition rather than cooperation among women — making the evolutionary logic for synchronization weak.',
      '"When you run the mathematics on random cycles overlapping, the frequency of perceived synchronization is exactly what you would expect by chance. The effect is real — but it is a cognitive bias, not biology." — Oxford Academic Journal',
      'While cycles do not synchronize biologically, tracking your own cycle provides enormous health benefits. Identifying your personal hormonal patterns, energy surges in the follicular phase, and recovery needs in the luteal phase allows for genuinely personalized training, nutrition, and wellness planning.',
      'Apps like Clue, Natural Cycles, and Flo have accumulated enough cycle data across millions of users to produce landmark research insights — proving that cycle science itself, regardless of synchronization myths, is a powerful wellness frontier.'
    ],
    readTime: '5 min',
    emoji: '🧬',
    tag: 'Hormonal Health',
    tagColor: 'bg-pink-100 text-pink-700',
    source: 'Oxford Academic'
  },
  {
    id: 'b15',
    category: 'workout',
    title: 'Strength Training for Women: The Science of Muscle as Medicine',
    summary: 'Resistance training increases bone density, improves insulin sensitivity, and reduces visceral fat more effectively than cardio alone — even 2x/week is transformative.',
    content: [
      'For years, strength training was wrongly associated with bulking up and was largely avoided by women. Today, the science is unambiguous: resistance training is one of the most powerful longevity and health interventions available to women of all ages.',
      'Building skeletal muscle mass increases the resting metabolic rate (burning more calories at rest), dramatically improves insulin sensitivity by creating more glucose sink capacity in muscles, and reduces visceral (belly) fat more effectively than steady-state cardio when total training volume is equated.',
      'Bone mineral density is a critical concern for women as estrogen declines during perimenopause and menopause. Progressive resistance training is the most potent non-pharmacological stimulus for osteoblast (bone-building cell) activity, directly fighting osteoporosis.',
      '"Muscle is the organ of longevity. The more muscle mass you carry into older age, the more metabolic reserve you have against disease, sarcopenia, and fragility." — Dr. Gabrielle Lyon, MD',
      'A 2022 meta-analysis in the British Journal of Sports Medicine found that strength training just twice per week reduces all-cause mortality risk by 23% and cardiovascular mortality by 27% — independently of aerobic exercise.',
      'Start with compound movements: squats, hinges (deadlifts/Romanian deadlifts), pushes (push-ups/overhead press), and pulls (rows/lat pulldowns). Progressive overload — gradually increasing weight or reps — is the key mechanism for continued adaptation.'
    ],
    readTime: '7 min',
    emoji: '🏋️‍♀️',
    tag: 'Fitness Research',
    tagColor: 'bg-orange-100 text-orange-700',
    source: 'British Journal of Sports Medicine'
  },
  {
    id: 'b16',
    category: 'mental-health',
    title: 'Journaling for Mental Health: What the Research Says',
    summary: 'Expressive writing for just 15-20 minutes, 3 days per week has been shown to reduce anxiety, improve immune function, and increase psychological well-being.',
    content: [
      'Journaling has been practiced for centuries, but it is only recently that rigorous clinical research has confirmed its profound psychological benefits. Psychologist James Pennebaker\'s landmark research at the University of Texas established that expressive writing significantly reduces stress and improves mental health.',
      'In controlled studies, participants who wrote about their deepest thoughts and feelings for 15-20 minutes on 3-4 consecutive days showed reduced anxiety, fewer doctor visits, improved immune function, and higher life satisfaction — effects that persisted for months.',
      'The mechanism behind journaling\'s benefits involves translating vague, overwhelming emotional experiences into structured linguistic narrative — a process that activates the prefrontal cortex (rational brain) and downregulates the amygdala (emotional alarm center).',
      '"Putting our emotional experiences into words literally changes the way we process them neurologically. Writing is a form of emotional digestion." — Dr. James Pennebaker, University of Texas',
      'There are different journaling approaches for different goals: Free-writing (unstructured stream of consciousness) helps process complex emotions. Gratitude journaling (3 specific things daily) shifts attentional bias toward positive experiences. Cognitive journaling (Thought Records from CBT) helps challenge and reframe unhelpful beliefs.',
      'Start small: commit to just 10 minutes before bed. Even bullet-point journaling — listing events, feelings, and one thing you\'re grateful for — captures most of the psychological benefit of formal expressive writing.'
    ],
    readTime: '5 min',
    emoji: '📔',
    tag: 'Mental Wellness',
    tagColor: 'bg-purple-100 text-purple-700',
    source: 'APA Journals'
  },
  {
    id: 'b17',
    category: 'nutrition',
    title: 'Omega-3 vs Omega-6: The Inflammation Equation',
    summary: 'Modern diets have a 20:1 omega-6 to omega-3 ratio. The ideal is 4:1. This imbalance drives systemic inflammation linked to heart disease, depression, and autoimmunity.',
    content: [
      'Omega-3 and omega-6 fatty acids are both essential — your body cannot produce them, so they must come from food. However, their ratio in the diet determines whether your body trends toward inflammation or anti-inflammation.',
      'The ancestral human diet had an omega-6 to omega-3 ratio of approximately 4:1. Modern Western diets, dominated by vegetable oils (corn, sunflower, soybean), processed snacks, and grain-fed meat, have pushed this ratio to an alarming 20:1 or higher.',
      'This imbalance fuels chronic low-grade inflammation — the underlying driver of cardiovascular disease, depression, type 2 diabetes, and autoimmune conditions. Omega-6 fatty acids (especially arachidonic acid) are substrates for pro-inflammatory eicosanoids, while omega-3 fatty acids (EPA and DHA) convert into anti-inflammatory resolvins and protectins.',
      '"Correcting the omega-6 to omega-3 ratio is one of the highest-impact dietary interventions for reducing systemic inflammation and improving cardiovascular and mental health outcomes." — Dr. Joseph Hibbeln, National Institutes of Health',
      'To rebalance, reduce consumption of processed foods and seed oils (use olive oil, avocado oil, or butter instead), and increase EPA/DHA from fatty fish (salmon, sardines, mackerel) 2-3 times per week or via high-quality fish oil supplements (2-3g EPA+DHA daily).',
      'For vegetarians and vegans, algae-derived omega-3 oil is the only complete source of EPA and DHA, as ALA from flaxseed has a poor conversion rate (under 10%) to the active EPA/DHA forms the body requires.'
    ],
    readTime: '6 min',
    emoji: '🐟',
    tag: 'Nutrition Science',
    tagColor: 'bg-emerald-100 text-emerald-700',
    source: 'NIH Research'
  },
  {
    id: 'b18',
    category: 'hormones',
    title: 'Thyroid Health: The Silent Regulator of Everything',
    summary: 'The thyroid controls metabolism, body temperature, heart rate, and mood. An underactive thyroid affects 1 in 8 women and is frequently underdiagnosed for years.',
    content: [
      'The thyroid gland — a butterfly-shaped organ at the base of the throat — produces hormones (T3 and T4) that regulate nearly every metabolic function in the body. From heart rate and body temperature to mood, cognitive function, and weight regulation, the thyroid is the master metabolic regulator.',
      'Hypothyroidism (underactive thyroid) affects approximately 1 in 8 women during their lifetime, yet it frequently goes undiagnosed for years. Symptoms are nonspecific and easily attributed to other causes: fatigue, brain fog, weight gain, constipation, dry skin, hair thinning, and depression.',
      'Hashimoto\'s thyroiditis — an autoimmune condition — is the most common cause of hypothyroidism in developed countries. In Hashimoto\'s, the immune system attacks thyroid tissue, gradually reducing hormone output. Gluten sensitivity and gut dysbiosis are increasingly linked to its onset.',
      '"Thyroid disorders are vastly underdiagnosed because TSH ranges used in standard testing are controversial — many functional medicine practitioners advocate for a narrower optimal range of 1.0-2.5 mIU/L rather than the lab\'s 0.5-4.5." — Dr. Isabella Wentz, PharmD',
      'To support thyroid health nutritionally, ensure adequate iodine (from seaweed, iodized salt, fish), selenium (2 Brazil nuts daily provide the required dose), and zinc. Avoid excessive consumption of raw cruciferous vegetables if thyroid function is already compromised, as goitrogens can inhibit iodine uptake.',
      'Request a comprehensive thyroid panel (TSH, Free T3, Free T4, Reverse T3, and thyroid antibodies TPO and TgAb) from your physician, especially if you have unexplained fatigue, weight changes, or a family history of thyroid disease.'
    ],
    readTime: '6 min',
    emoji: '🦋',
    tag: 'Hormonal Health',
    tagColor: 'bg-pink-100 text-pink-700',
    source: 'Endocrine Society'
  },
  {
    id: 'b19',
    category: 'workout',
    title: 'Walking 10,000 Steps: Science Behind the Golden Number',
    summary: 'The 10,000 steps goal originated in a 1960s Japanese marketing campaign — but modern science confirms that 7,000-8,000 daily steps is the sweet spot for longevity.',
    content: [
      'The goal of 10,000 steps per day has become a universal fitness benchmark, appearing on fitness trackers, health apps, and workplace wellness programs worldwide. But where did this number actually come from — and is it backed by science?',
      'It originated from a 1964 Japanese marketing campaign for a pedometer called the Manpo-kei (meaning \'10,000 steps meter\' in Japanese). The number was chosen because its character resembles a walking man — not because of any clinical research.',
      'Modern scientific evidence tells a slightly different story. A 2021 study published in JAMA Internal Medicine (tracking over 4,800 older adults for 10 years) found that mortality risk decreased progressively up to about 7,500 steps per day, after which benefits plateaued.',
      '"There is nothing magical about 10,000 steps. What the research shows is that going from sedentary to moderately active is where the greatest health gains occur. Every 1,000 steps added reduces mortality risk substantially." — Dr. I-Min Lee, Harvard School of Public Health',
      'More important than the raw step count is step intensity. A 2022 study in JAMA Internal Medicine found that people who mixed brisk walking (faster cadence) with their daily steps had even greater cardiovascular benefits — regardless of total step count.',
      'Practical target: aim for 7,000 steps as your minimum baseline, with three 10-minute brisk walking bouts (the "snack walking" model shown to reduce blood pressure) interspersed throughout your day, ideally outside in natural light.'
    ],
    readTime: '5 min',
    emoji: '👟',
    tag: 'Fitness Research',
    tagColor: 'bg-orange-100 text-orange-700',
    source: 'JAMA Internal Medicine'
  },
  {
    id: 'b20',
    category: 'mental-health',
    title: 'The Dopamine Detox: Reclaiming Motivation in a Distracted World',
    summary: 'Overstimulation from social media, junk food, and instant gratification depletes dopamine receptors. A structured detox restores baseline sensitivity and intrinsic motivation.',
    content: [
      'Dopamine is often called the pleasure chemical, but more accurately, it is the anticipation and motivation chemical. It drives you toward goals and creates the drive to pursue rewards. However, modern environments bombard our dopamine systems with constant, easily accessible micro-rewards.',
      'Endless scrolling, junk food, gambling mechanics in apps, and streaming services all trigger dopamine releases without requiring real-world effort. Over time, this constant stimulation downregulates dopamine receptor sensitivity — meaning you need more and more stimulation to feel the same level of satisfaction.',
      'The result is a chronic state of low motivation, boredom with real-life activities, difficulty concentrating, and reliance on external stimulation. This is colloquially called dopamine burnout, and it is increasingly common in the digital age.',
      '"The dopamine system was designed to operate in a world where rewards were rare and required effort. Modern technology has flipped this completely. The calibration gets destroyed." — Dr. Anna Lembke, Stanford Psychiatry, Dopamine Nation',
      'A dopamine reset involves deliberately removing high-dopamine, low-effort activities (social media, junk food, video games) for a defined period — typically 24-72 hours — to allow receptor sensitivity to recover. During this time, you may feel bored, anxious, or irritable — these are signs of recalibration.',
      'After a detox, intrinsic motivation for meaningful activities (exercise, deep work, meaningful relationships) naturally re-emerges. Maintain sensitivity by creating intentional friction around high-dopamine activities: no phone before noon, designated social media windows, and phone-free meals.'
    ],
    readTime: '7 min',
    emoji: '🧪',
    tag: 'Mental Wellness',
    tagColor: 'bg-purple-100 text-purple-700',
    source: 'Stanford Psychiatry'
  }
];

const CATEGORY_CONFIG: Record<DiscussionCategory, { label: string; icon: any; color: string; bg: string }> = {
  all: { label: 'All Topics', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
  nutrition: { label: 'Nutrition', icon: Apple, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  workout: { label: 'Workout', icon: Dumbbell, color: 'text-orange-600', bg: 'bg-orange-100' },
  'mental-health': { label: 'Mental Health', icon: Smile, color: 'text-purple-600', bg: 'bg-purple-100' },
  hormones: { label: 'Hormones', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  sleep: { label: 'Sleep', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  general: { label: 'General', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Home() {
  const { user } = useAppContext();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const firstName = (user?.name || dashboard?.profile?.name || '').split(' ')[0];
  const userName = firstName || 'there';

  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('daily');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskDuration, setTaskDuration] = useState('30');
  const [taskPriority, setTaskPriority] = useState('medium');

  // ── Sleep Log State ────────────────────────────────────────────────────────
  const [sleepBedTime, setSleepBedTime] = useState('22:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('06:30');
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [sleepDreams, setSleepDreams] = useState(false);
  const [isLoggingSleep, setIsLoggingSleep] = useState(false);
  const [sleepLogSuccess, setSleepLogSuccess] = useState(false);

  // ── Community Section State ────────────────────────────────────────────────
  const [communityTab, setCommunityTab] = useState<'feed' | 'discuss'>('discuss');
  const [discCategory, setDiscCategory] = useState<DiscussionCategory>('all');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discLoading, setDiscLoading] = useState(false);
  const [expandedDisc, setExpandedDisc] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [showNewDiscForm, setShowNewDiscForm] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');
  const [newDiscCategory, setNewDiscCategory] = useState<string>('general');
  const [submittingDisc, setSubmittingDisc] = useState(false);
  const [blogCategory, setBlogCategory] = useState<string>('all');
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  // ── Icon Panel State ───────────────────────────────────────────────────────
  const [activeSidePanel, setActiveSidePanel] = useState<'sleep' | 'tasks' | 'community' | null>(null);
  const togglePanel = (panel: 'sleep' | 'tasks' | 'community') =>
    setActiveSidePanel(prev => prev === panel ? null : panel);

  // ── Fetch dashboard ────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/health/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const body = await res.json();
      if (body?.success && body?.data) {
        setDashboard(body.data as Dashboard);
      } else {
        throw new Error(body?.error?.message || 'Unexpected response');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.success) {
          const taskData = body.data?.tasks || [];
          setTasks(Array.isArray(taskData) ? taskData : []);
        }
      }
    } catch {
      // silently keep empty
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // ── Fetch user profile & calculate health score ─────────────────────────
  const fetchProfileAndCalc = useCallback(async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.USER.PROFILE);
      if (response.data && response.data.profile) {
        const p = response.data.profile;
        const u = response.data.user;
        const profileData: ProfileData = {
          sleepPatterns: { averageHours: p.sleepPatterns?.averageHours || 7, quality: p.sleepPatterns?.quality || 'Good', bedtime: p.sleepPatterns?.bedtime || '23:00', wakeTime: p.sleepPatterns?.wakeTime || '06:00' },
          mentalHealth: {
            stressLevel: p.mentalHealth?.stressLevel || 'Sometimes',
            anxietyLevel: p.mentalHealth?.anxietyLevel || 'Sometimes',
            moodStability: p.mentalHealth?.moodStability || 'Stable',
            confidenceLevel: p.mentalHealth?.confidenceLevel || 'Medium',
            emotionalPatterns: { overthinking: p.mentalHealth?.emotionalPatterns?.overthinking || false, motivationConsistency: p.mentalHealth?.emotionalPatterns?.motivationConsistency || 'Medium' }
          },
          nutrition: {
            dietType: p.nutrition?.dietType || '',
            dietQuality: p.nutrition?.dietQuality || 5,
            mealPatterns: p.nutrition?.mealPatterns || { breakfast: { eats: 'Sometimes', typicalFoods: [] }, lunch: { typicalFoods: [] }, dinner: { size: 'Moderate', time: '8 PM' }, snacks: { frequency: 'Moderate', type: 'Mixed' } },
            hydration: p.nutrition?.hydration || '1-2L',
            eatingBehavior: p.nutrition?.eatingBehavior || { emotionalEating: 'Sometimes', cravings: [] }
          },
          fitness: {
            fitnessLevel: p.fitness?.fitnessLevel || 'Beginner',
            weeklyFrequency: p.fitness?.weeklyFrequency || '2-3 days',
            preferredWorkoutType: p.fitness?.preferredWorkoutType || [],
            workoutDuration: p.fitness?.workoutDuration || '20-40 min'
          },
          hormonal: {
            menstrualCycle: p.hormonal?.menstrualCycle || '',
            typicalFlowIntensity: p.hormonal?.typicalFlowIntensity || 'moderate',
            hormoneIssues: p.hormonal?.hormoneIssues || []
          },
          lifestyle: {
            dailyEnergyLevels: p.lifestyle?.dailyEnergyLevels || 'Moderate',
            stressPrevalence: p.lifestyle?.stressPrevalence || 'medium',
            chronicPain: p.lifestyle?.chronicPain || false
          },
          gender: u?.gender || 'female'
        };
        const result = calculateHealthScore(profileData);
        setHealthScore(result);
        setProfileLoaded(true);
      }
    } catch (err) {
      console.error('Profile-based score failed:', err);
    }
  }, []);

  // ── Fetch discussions ──────────────────────────────────────────────────────
  const fetchDiscussions = useCallback(async (category: DiscussionCategory = 'all') => {
    try {
      setDiscLoading(true);
      const token = localStorage.getItem('token') || '';
      const catParam = category !== 'all' ? `&category=${category}` : '';
      const res = await fetch(`/api/v1/discussions?limit=30${catParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.success) setDiscussions(body.data.discussions || []);
      }
    } catch { /* silent */ } finally {
      setDiscLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); fetchTasks(); fetchProfileAndCalc(); }, [fetchDashboard, fetchTasks, fetchProfileAndCalc]);
  useEffect(() => { if (communityTab === 'discuss') fetchDiscussions(discCategory); }, [communityTab, discCategory, fetchDiscussions]);

  // ── Toggle task ────────────────────────────────────────────────────────────
  const toggleTask = async (taskId: string, current: string) => {
    const next = current === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: next } : t));
    try {
      await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: next })
      });
    } catch {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: current } : t));
    }
  };

  // ── Add task ───────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          type: taskType,
          date: taskDate || new Date().toISOString(),
          scheduledTime: taskTime,
          duration: parseInt(taskDuration) || 30,
          priority: taskPriority
        })
      });
      if (res.ok) {
        fetchTasks();
        setTaskTitle(''); setTaskType('daily');
        setTaskDate(new Date().toISOString().split('T')[0]);
        setTaskTime('09:00'); setTaskDuration('30'); setTaskPriority('medium');
        setIsModalOpen(false);
      }
    } catch { /* silently ignore */ }
  };

  // ── Delete task ────────────────────────────────────────────────────────────
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setTasks(prev => prev.filter(t => t._id !== (taskId as any)));
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch {
      fetchTasks();
    }
  };

  // ── Log Sleep ───────────────────────────────────────────────────────────────
  const logSleep = async () => {
    try {
      setIsLoggingSleep(true);
      const res = await fetch('/api/v1/health/sleep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          bedTime: sleepBedTime,
          wakeTime: sleepWakeTime,
          quality: sleepQuality,
          dreams: sleepDreams,
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setSleepLogSuccess(true);
        setTimeout(() => setSleepLogSuccess(false), 3000);
        fetchDashboard();
      }
    } catch { /* silently error out */ } finally {
      setIsLoggingSleep(false);
    }
  };

  // ── Discussion actions ─────────────────────────────────────────────────────
  const likeDiscussion = async (discId: string) => {
    const token = localStorage.getItem('token') || '';
    setDiscussions(prev => prev.map(d =>
      d._id === discId ? { ...d, likes: d.hasLiked ? d.likes - 1 : d.likes + 1, hasLiked: !d.hasLiked } : d
    ));
    try {
      await fetch(`/api/v1/discussions/${discId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch { fetchDiscussions(discCategory); }
  };

  const submitReply = async (discId: string) => {
    const content = replyContent[discId]?.trim();
    if (!content) return;
    setSubmittingReply(discId);
    try {
      const res = await fetch(`/api/v1/discussions/${discId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setReplyContent(prev => ({ ...prev, [discId]: '' }));
        fetchDiscussions(discCategory);
      }
    } catch { /* silent */ } finally {
      setSubmittingReply(null);
    }
  };

  const submitDiscussion = async () => {
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;
    setSubmittingDisc(true);
    try {
      const res = await fetch('/api/v1/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ title: newDiscTitle.trim(), content: newDiscContent.trim(), category: newDiscCategory })
      });
      if (res.ok) {
        setNewDiscTitle(''); setNewDiscContent(''); setNewDiscCategory('general');
        setShowNewDiscForm(false);
        fetchDiscussions(discCategory);
      }
    } catch { /* silent */ } finally {
      setSubmittingDisc(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  // ── Task Rendering ────────────────────────────────────────────────────────
  const renderTaskCard = (task: any) => {
    const done = task.status === 'completed';
    const id = task._id || task.id;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const allSubtasksDone = hasSubtasks && task.subtasks.every((st: any) => st.completed);
    const canToggleMain = !hasSubtasks || allSubtasksDone || done;
    const isMed = task.type === 'medicine';

    return (
      <div key={id} className={cn('flex flex-col p-4 rounded-2xl border transition-all duration-300 relative group/card',
        done ? 'bg-emerald-50/30 border-emerald-100 opacity-80' : 'bg-white border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md'
      )}>
        {!done && task.priority && (
          <div className="absolute top-0 right-4 transform -translate-y-1/2">
            <span className={cn("text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm",
              task.priority === 'high' ? 'bg-rose-500' :
              task.priority === 'medium' ? 'bg-orange-400' :
              'bg-slate-400'
            )}>
              {task.priority}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            disabled={!canToggleMain && !done}
            onClick={() => { if (canToggleMain || done) toggleTask(id, task.status || 'pending'); else alert('Please complete all items in the list first!'); }}
            className="flex-shrink-0"
          >
            {done
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <Circle className={cn("w-5 h-5", !canToggleMain ? "text-slate-200" : "text-slate-300 group-hover/card:text-purple-400")} />}
          </button>

          <div className="flex-1 min-w-0">
            <span className={cn('text-sm font-semibold block truncate', done ? 'line-through text-slate-400' : 'text-slate-700')}>
              {task.title}
            </span>
            {task.scheduledTime && (
              <div className="flex items-center gap-1 mt-0.5">
                <RefreshCw className={cn("w-2.5 h-2.5", isMed ? "text-rose-400" : "text-slate-300")} />
                <span className={cn("text-[10px] font-bold tracking-tighter uppercase",
                  isMed ? "text-rose-500 bg-rose-50 px-1.5 rounded" : "text-slate-400")}>
                  {isMed ? 'Take at ' : ''}{task.scheduledTime}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest",
                allSubtasksDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
              )}>
                {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(id); }}
              className="opacity-0 group-hover/card:opacity-100 p-1.5 hover:bg-rose-50 hover:text-rose-500 text-slate-300 rounded-lg transition-all"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasSubtasks && (
          <div className="mt-4 ml-8 space-y-2.5 pt-3 border-t border-slate-50">
            {task.subtasks.map((st: any, idx: number) => (
              <div key={st.id || idx} className="flex items-center gap-2.5 group/st cursor-pointer"
                onClick={() => toggleSubtask(id, st.id, !st.completed)}>
                <div className="flex-shrink-0">
                  <div className={cn("w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all duration-300",
                    st.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover/st:border-purple-400 group-hover/st:scale-110")}>
                    {st.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>
                <span className={cn("text-xs font-semibold transition-colors",
                  st.completed ? "text-slate-300 line-through" : "text-slate-600 group-hover/st:text-purple-600")}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const toggleSubtask = async (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks(prev => prev.map(t => {
      if (t._id === taskId) {
        const newSubtasks = t.subtasks.map((st: any) =>
          st.id === subtaskId ? { ...st, completed } : st
        );
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    }));

    try {
      await fetch(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ completed })
      });
    } catch {
      fetchTasks();
    }
  };

  const filteredBlogs = blogCategory === 'all' ? BLOG_POSTS : BLOG_POSTS.filter(b => b.category === blogCategory);

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 px-0" onClick={(e) => { if ((e.target as HTMLElement).closest('[data-panel]') === null && activeSidePanel) setActiveSidePanel(null); }}>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-end items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 tracking-tight">
            Hello, {userName}!
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            {dashboard?.summary || "Here's your health overview for today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          {/* Date chip */}
          <p className="text-xs font-bold text-purple-500 uppercase tracking-widest bg-purple-100 px-3 py-2 rounded-xl hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200 mx-1 hidden sm:block" />

          {/* Sleep icon button */}
          <button
            data-panel="sleep"
            onClick={(e) => { e.stopPropagation(); togglePanel('sleep'); }}
            title="Log Sleep"
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border',
              activeSidePanel === 'sleep'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-indigo-500 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-300'
            )}
          >
            <Moon className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
            {sleepLogSuccess && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Tasks icon button */}
          <button
            data-panel="tasks"
            onClick={(e) => { e.stopPropagation(); togglePanel('tasks'); }}
            title="Your Tasks"
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border',
              activeSidePanel === 'tasks'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-white text-purple-500 border-purple-100 hover:bg-purple-50 hover:border-purple-300'
            )}
          >
            <CheckCircle2 className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
            {tasks.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 text-[9px] font-black bg-purple-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                {tasks.filter(t => t.status !== 'completed').length || ''}
              </span>
            )}
          </button>

          {/* Community icon button */}
          <button
            data-panel="community"
            onClick={(e) => { e.stopPropagation(); togglePanel('community'); }}
            title="Community"
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm border',
              activeSidePanel === 'community'
                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                : 'bg-white text-violet-500 border-violet-100 hover:bg-violet-50 hover:border-violet-300'
            )}
          >
            <Users className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-2xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error} — showing defaults below.</span>
        </div>
      )}

      {/* ── Health Feed — Main Card ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 sm:px-8 pt-5 sm:pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Health Feed</h2>
              <p className="text-xs text-slate-400 font-medium">Curated health insights · evidence-based</p>
            </div>
          </div>
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none w-full md:w-auto pb-2 md:pb-0">
            {['all', 'nutrition', 'workout', 'sleep', 'mental-health', 'hormones'].map(cat => (
              <button
                key={cat}
                onClick={() => setBlogCategory(cat)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize',
                  blogCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {cat === 'mental-health' ? 'Mental' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feed grid */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBlogs.map(post => {
              const catCfg = CATEGORY_CONFIG[post.category as DiscussionCategory] || CATEGORY_CONFIG.general;
              return (
                <div key={post.id} onClick={() => setSelectedBlog(post)}
                  className="group bg-white/80 border border-slate-100 rounded-2xl p-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm', catCfg.bg)}>
                      {post.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', post.tagColor)}>
                          {post.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-purple-700 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{post.summary}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-medium">{post.readTime} read</span>
                    <span className="text-[10px] text-slate-400 font-medium">{post.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Side Panels ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeSidePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-[2px]"
              onClick={() => setActiveSidePanel(null)}
            />

            {/* Modal */}
            <motion.div
              data-panel="true"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 m-auto z-[70] w-[95%] sm:w-full max-w-2xl h-[90vh] sm:h-[80vh] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >

              {/* ── SLEEP PANEL ──────────────────────────────────────── */}
              {activeSidePanel === 'sleep' && (
                <>
                  <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                        <Moon className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Log Sleep</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {dashboard?.metrics?.sleep && dashboard.metrics.sleep !== 'N/A'
                            ? `Last: ${dashboard.metrics.sleep}`
                            : 'Track sleep for your health score'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveSidePanel(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Bed Time</label>
                      <input type="time" value={sleepBedTime} onChange={e => setSleepBedTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 outline-none focus:ring-indigo-500 transition-all text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Wake Time</label>
                      <input type="time" value={sleepWakeTime} onChange={e => setSleepWakeTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 outline-none focus:ring-indigo-500 transition-all text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Quality (1–10)</label>
                      <input type="number" min="1" max="10" value={sleepQuality} onChange={e => setSleepQuality(parseInt(e.target.value) || 7)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 outline-none focus:ring-indigo-500 transition-all text-slate-700" />
                    </div>
                    <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-300 transition-all">
                      <span className="text-sm font-semibold text-slate-700">Had Dreams?</span>
                      <input type="checkbox" checked={sleepDreams} onChange={e => setSleepDreams(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300 focus:ring-indigo-500" />
                    </label>
                  </div>

                  <div className="flex-shrink-0 p-5 border-t border-slate-100">
                    <button
                      disabled={isLoggingSleep}
                      onClick={async () => { await logSleep(); }}
                      className={cn("w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2",
                        sleepLogSuccess ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
                      )}
                    >
                      {isLoggingSleep ? <Loader2 className="w-4 h-4 animate-spin" /> : sleepLogSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {sleepLogSuccess ? 'Sleep Logged!' : 'Save Sleep'}
                    </button>
                  </div>
                </>
              )}

              {/* ── TASKS PANEL ──────────────────────────────────────── */}
              {activeSidePanel === 'tasks' && (
                <>
                  <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
                        <CheckCircle2 className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Your Action Plan</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {tasks.filter(t => t.status !== 'completed').length} pending · {tasks.filter(t => t.status === 'completed').length} done
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsModalOpen(true)}
                        className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors border border-purple-100">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveSidePanel(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {tasksLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-10">
                        <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No tasks yet</p>
                        <p className="text-xs text-slate-300 mt-1">Tap + to add your first task!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const PRIORITY_WEIGHT: Record<string, number> = { high: 1, medium: 2, low: 3 };
                          const dueTasks = tasks
                            .filter(t => t.status !== 'completed')
                            .sort((a, b) => (PRIORITY_WEIGHT[a.priority] || 3) - (PRIORITY_WEIGHT[b.priority] || 3));
                          const completedTasks = tasks.filter(t => t.status === 'completed');
                          
                          return (
                            <>
                              {dueTasks.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <Activity className="w-3 h-3" /> Due
                                  </h4>
                                  {dueTasks.map(task => renderTaskCard(task))}
                                </div>
                              )}
                              
                              {completedTasks.length > 0 && (
                                <div className="space-y-3 mt-6">
                                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                  </h4>
                                  <div className="opacity-75 space-y-3">
                                    {completedTasks.map(task => renderTaskCard(task))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── COMMUNITY PANEL ──────────────────────────────────── */}
              {activeSidePanel === 'community' && (
                <>
                  <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-xl text-violet-600">
                        <Users className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Community</h3>
                    </div>
                    <button onClick={() => setActiveSidePanel(null)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-100/80 mt-4 flex-shrink-0">
                    {(['discuss', 'feed'] as const).map(tab => (
                      <button key={tab}
                        onClick={() => setCommunityTab(tab)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all',
                          communityTab === tab
                            ? 'text-purple-700 border-b-2 border-purple-500 bg-white/40'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {tab === 'discuss' ? <><MessageCircle className="w-3.5 h-3.5" />Discuss</> : <><BookOpen className="w-3.5 h-3.5" />Feed</>}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {communityTab === 'discuss' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl px-3 py-1.5">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-bold text-purple-700">100% Anonymous</span>
                          </div>
                        </div>

                        {/* Category pills */}
                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                          {(Object.keys(CATEGORY_CONFIG) as DiscussionCategory[]).map(cat => {
                            const cfg = CATEGORY_CONFIG[cat];
                            return (
                              <button key={cat} onClick={() => setDiscCategory(cat)}
                                className={cn('flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all',
                                  discCategory === cat ? `${cfg.bg} ${cfg.color} shadow-sm` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                )}>
                                <cfg.icon className="w-2.5 h-2.5" />{cfg.label}
                              </button>
                            );
                          })}
                        </div>

                        <button onClick={() => setShowNewDiscForm(!showNewDiscForm)}
                          className="w-full flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl px-4 py-2.5 transition-all shadow-md text-sm font-bold">
                          <Plus className="w-4 h-4" />
                          Share anonymously…
                        </button>

                        <AnimatePresence>
                          {showNewDiscForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3 space-y-2">
                                <input value={newDiscTitle} onChange={e => setNewDiscTitle(e.target.value)}
                                  placeholder="Topic or question?"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-400" />
                                <textarea value={newDiscContent} onChange={e => setNewDiscContent(e.target.value)}
                                  placeholder="Share your thoughts anonymously…" rows={3}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-400 resize-none" />
                                <div className="flex items-center gap-2">
                                  <select value={newDiscCategory} onChange={e => setNewDiscCategory(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:outline-none text-slate-700">
                                    {(Object.keys(CATEGORY_CONFIG) as DiscussionCategory[]).filter(c => c !== 'all').map(c => (
                                      <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                                    ))}
                                  </select>
                                  <div className="flex-1" />
                                  <button onClick={() => setShowNewDiscForm(false)} className="text-[10px] font-bold text-slate-500 px-2 py-1.5">Cancel</button>
                                  <button onClick={submitDiscussion} disabled={submittingDisc || !newDiscTitle.trim() || !newDiscContent.trim()}
                                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all">
                                    {submittingDisc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Post
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-2.5">
                          {discLoading ? (<div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>)
                          : discussions.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-slate-400">No discussions yet</p>
                            </div>
                          ) : discussions.map(disc => {
                            const catCfg = CATEGORY_CONFIG[disc.category as DiscussionCategory] || CATEGORY_CONFIG.general;
                            const isExpanded = expandedDisc === disc._id;
                            return (
                              <div key={disc._id} className="bg-white/90 border border-slate-100 rounded-2xl overflow-hidden hover:border-purple-100 transition-all">
                                <div className="p-3">
                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', catCfg.bg, catCfg.color)}>{catCfg.label}</span>
                                    <span className="text-[9px] text-slate-400">{disc.anonAlias}</span>
                                    <span className="text-[9px] text-slate-300">·</span>
                                    <span className="text-[9px] text-slate-400">{new Date(disc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-800 leading-snug mb-1">{disc.title}</h4>
                                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{disc.content}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => likeDiscussion(disc._id)}
                                      className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all',
                                        disc.hasLiked ? 'bg-purple-100 text-purple-600' : 'bg-slate-50 text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                                      )}><ThumbsUp className="w-3 h-3" />{disc.likes}</button>
                                    <button onClick={() => setExpandedDisc(isExpanded ? null : disc._id)}
                                      className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded-lg transition-all">
                                      <MessageCircle className="w-3 h-3" />{disc.replies.length}
                                      {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                    </button>
                                  </div>
                                </div>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/60">
                                      <div className="p-3 space-y-2">
                                        {disc.replies.map((reply, i) => (
                                          <div key={reply._id || i} className="bg-white rounded-xl p-2.5 border border-slate-100">
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <span className="text-[9px] font-bold text-purple-600">{reply.anonAlias}</span>
                                              <span className="text-[9px] text-slate-300">·</span>
                                              <span className="text-[9px] text-slate-400">{new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">{reply.content}</p>
                                          </div>
                                        ))}
                                        <div className="flex gap-2 mt-1">
                                          <input value={replyContent[disc._id] || ''} onChange={e => setReplyContent(prev => ({ ...prev, [disc._id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && submitReply(disc._id)}
                                            placeholder="Reply anonymously…"
                                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-300" />
                                          <button onClick={() => submitReply(disc._id)} disabled={submittingReply === disc._id || !replyContent[disc._id]?.trim()}
                                            className="p-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-all">
                                            {submittingReply === disc._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Mini feed inside community panel */
                      <div className="space-y-2.5">
                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                          {['all', 'nutrition', 'workout', 'sleep', 'mental-health', 'hormones'].map(cat => (
                            <button key={cat} onClick={() => setBlogCategory(cat)}
                              className={cn('flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all capitalize',
                                blogCategory === cat ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              )}>{cat === 'mental-health' ? 'Mental' : cat}</button>
                          ))}
                        </div>
                        {filteredBlogs.slice(0, 8).map(post => {
                          const catCfg = CATEGORY_CONFIG[post.category as DiscussionCategory] || CATEGORY_CONFIG.general;
                          return (
                            <div key={post.id} onClick={() => setSelectedBlog(post)}
                              className="group bg-white/90 border border-slate-100 rounded-2xl p-3 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer flex items-start gap-3">
                              <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg', catCfg.bg)}>{post.emoji}</div>
                              <div className="flex-1 min-w-0">
                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', post.tagColor)}>{post.tag}</span>
                                <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-purple-700 mt-1 line-clamp-2">{post.title}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{post.readTime} · {post.source}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* ── Add Task Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Add New Task</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Task Name</label>
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g., Take Vitamin D"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                    <select value={taskType} onChange={e => setTaskType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all">
                      <option value="daily">Daily Habit</option>
                      <option value="medicine">Medicine</option>
                      <option value="workout">Workout</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="mental-health">Mental Health</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                    <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                    <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (min)</label>
                    <input type="number" value={taskDuration} onChange={e => setTaskDuration(e.target.value)} min="1" max="480"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button key={p} onClick={() => setTaskPriority(p)}
                        className={cn('flex-1 py-2 rounded-xl text-sm font-bold transition-all',
                          taskPriority === p
                            ? p === 'high' ? 'bg-rose-100 text-rose-600' : p === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                        {p[0].toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={addTask} disabled={!taskTitle.trim()}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]">
                  Add Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Article Reader Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBlog && (() => {
          const relatedPosts = BLOG_POSTS.filter(p => p.id !== selectedBlog.id && (p.category === selectedBlog.category || p.tag === selectedBlog.tag)).slice(0, 3);
          const isPullQuote = (text: string) => text.startsWith('"') && text.includes('—');
          return (
            <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedBlog(null)}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]"
              >
                {/* Drag Handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                  <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Hero Header */}
                <div className="relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600 opacity-90" />
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                  <button
                    onClick={() => setSelectedBlog(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="relative z-10 p-6 pb-5">
                    <div className="text-5xl mb-3 drop-shadow-lg">{selectedBlog.emoji}</div>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white/20 text-white uppercase tracking-widest border border-white/30 backdrop-blur-sm">
                      {selectedBlog.tag}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-3 drop-shadow-sm">
                      {selectedBlog.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-3 text-white/70 text-xs font-semibold">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{selectedBlog.readTime} read</span>
                      <span className="w-1 h-1 bg-white/40 rounded-full" />
                      <span>{selectedBlog.source}</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Article Body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 sm:p-8">
                    {/* Summary / Lead */}
                    <p className="text-base font-semibold text-slate-700 leading-relaxed mb-6 pb-6 border-b border-slate-100">
                      {selectedBlog.summary}
                    </p>

                    {/* Body Paragraphs */}
                    <div className="space-y-5">
                      {(selectedBlog.content || [selectedBlog.summary]).map((paragraph: string, idx: number) => (
                        isPullQuote(paragraph) ? (
                          <blockquote key={idx} className="relative pl-5 border-l-4 border-purple-400 my-6">
                            <p className="text-sm sm:text-base italic text-slate-600 leading-relaxed font-medium">{paragraph}</p>
                          </blockquote>
                        ) : (
                          <p key={idx} className="text-sm sm:text-[15px] text-slate-600 leading-[1.8] font-[450]">
                            {paragraph}
                          </p>
                        )
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="mt-10 mb-6 flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">More Articles</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Related Articles */}
                    {relatedPosts.length > 0 && (
                      <div className="space-y-3 pb-2">
                        {relatedPosts.map(rp => (
                          <button
                            key={rp.id}
                            onClick={() => setSelectedBlog(rp)}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
                          >
                            <span className="text-2xl flex-shrink-0">{rp.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 group-hover:text-purple-700 transition-colors leading-snug truncate">{rp.title}</p>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{rp.readTime} · {rp.source}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-purple-400 -rotate-90 flex-shrink-0 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex justify-between items-center rounded-b-[2rem]">
                  <span className="text-xs text-slate-400 font-semibold">Source: {selectedBlog.source}</span>
                  <button
                    onClick={() => setSelectedBlog(null)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Done Reading
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}



