import { useTranslation } from 'react-i18next';
import KanbanBoard from '../components/tasks/KanbanBoard.jsx';
import Whiteboard from '../components/Whiteboard.jsx';
import DeadlinesPanel from '../components/home/DeadlinesPanel.jsx';
import PageShell from '../components/layout/PageShell.jsx';

// Landing page — the task board is the workspace (~80%); the noticeboard and
// my upcoming deadlines sit in a narrow side rail (~20%).
const Dashboard = () => {
  const { t } = useTranslation('common');

  return (
    <PageShell
      title={t('home')}
      mainClassName="p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-3.5rem)] lg:min-h-0"
    >
      <section className="h-[75vh] lg:h-auto lg:flex-1 min-w-0 min-h-0">
        <KanbanBoard />
      </section>

      <aside className="lg:w-1/5 lg:min-w-[240px] lg:max-w-[320px] flex flex-col gap-4 min-h-0">
        <div className="h-[420px] lg:h-auto lg:flex-1 min-h-0">
          <Whiteboard />
        </div>
        <div className="lg:max-h-[40%] min-h-0 flex flex-col">
          <DeadlinesPanel />
        </div>
      </aside>
    </PageShell>
  );
};

export default Dashboard;
