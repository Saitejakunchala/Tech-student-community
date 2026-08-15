import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  year?: number;
}

export function ActivityHeatmap({ data, year }: ActivityHeatmapProps) {
  const targetYear = year || new Date().getFullYear();
  const weeks = generateWeeks(targetYear);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  const getLevel = (count: number): number => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const levelColors = [
    'bg-slate-100',
    'bg-teal-200',
    'bg-teal-400',
    'bg-teal-500',
    'bg-teal-700',
  ];

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-2 min-w-full">
        <div className="flex gap-1 pl-8">
          {monthLabels.map((month, i) => (
            <div key={month} className="text-xs text-slate-400 font-medium" style={{ width: 'calc(12px * 4)' }}>
              {month}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 justify-around pr-1">
            {['Mon', 'Wed', 'Fri'].map((day) => (
              <div key={day} className="text-xs text-slate-400 font-medium h-3 flex items-center">{day}</div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) => {
                  if (!date) return <div key={di} className="w-3 h-3" />;
                  const count = countMap.get(date) || 0;
                  const level = getLevel(count);
                  return (
                    <div
                      key={di}
                      className={cn('w-3 h-3 rounded-sm transition-colors', levelColors[level])}
                      title={`${date}: ${count} activit${count === 1 ? 'y' : 'ies'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-1">
          <span className="text-xs text-slate-400">Less</span>
          {levelColors.map((color, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
          ))}
          <span className="text-xs text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
}

function generateWeeks(year: number): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const startDay = start.getDay();

  let current: (string | null)[] = Array(startDay).fill(null);
  const date = new Date(start);

  while (date <= end) {
    const dateStr = date.toISOString().split('T')[0];
    current.push(dateStr);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
    date.setDate(date.getDate() + 1);
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }
  return weeks;
}
