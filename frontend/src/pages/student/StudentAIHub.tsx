import { lazy, Suspense, useState } from 'react';
import { Bot, Sparkles, Calendar, HelpCircle, Loader2 } from 'lucide-react';

const AIChatbot        = lazy(() => import('@/components/ai/student/AIChatbot'));
const MyAIAnalysis     = lazy(() => import('@/components/ai/student/MyAIAnalysis'));
const StudyTimetable   = lazy(() => import('@/components/ai/student/StudyTimetable'));
const PracticeQuestions = lazy(() => import('@/components/ai/student/PracticeQuestions'));

const TABS = [
  { id: 'chat',      label: 'AI Tutor',    icon: Bot,           color: 'text-blue-500' },
  { id: 'analysis',  label: 'My Analysis', icon: Sparkles,      color: 'text-purple-500' },
  { id: 'timetable', label: 'Timetable',   icon: Calendar,      color: 'text-green-500' },
  { id: 'practice',  label: 'Practice',    icon: HelpCircle,    color: 'text-amber-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function StudentAIHub() {
  const [tab, setTab] = useState<TabId>('chat');

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden">
      <div className="max-w-lg mx-auto px-3 pt-4 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Learning Hub</h1>
            <p className="text-xs text-muted-foreground">Your personal AI study assistant</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 bg-muted/50 rounded-2xl p-1 mb-5">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all ${
                  active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? t.color : ''}`} />
                <span className="leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <Suspense fallback={<Spinner />}>
          {tab === 'chat'      && <AIChatbot />}
          {tab === 'analysis'  && <MyAIAnalysis />}
          {tab === 'timetable' && <StudyTimetable />}
          {tab === 'practice'  && <PracticeQuestions />}
        </Suspense>
      </div>
    </div>
  );
}
