import type { EntryWithContext } from "../types";
import { masteryTier } from "../utils/mastery";

interface Props {
  entry: EntryWithContext;
  onClick: () => void;
}

function sizeClass(hours: number): string {
  if (hours < 1) return "entry-card--sm";
  if (hours < 3) return "entry-card--md";
  return "entry-card--lg";
}

export default function EntryCard({ entry, onClick }: Props) {
  const color = entry.topic.subject.color;
  const tier = masteryTier(entry.topic.mastery);
  return (
    <div
      className={`entry-card ${sizeClass(entry.hours)}`}
      style={{ "--card-color": color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="entry-card-topic">{entry.topic.name}</div>
      <div className="entry-card-subject">{entry.topic.subject.name}</div>
      <div className="entry-card-hours">{entry.hours} ч</div>
      <div className="entry-card-mastery" title={`${tier.label}: ${entry.topic.mastery}%`}>
        <div className="entry-card-mastery-track">
          <div
            className="entry-card-mastery-fill"
            style={{ width: `${entry.topic.mastery}%`, background: tier.color }}
          />
        </div>
        <span className="entry-card-mastery-value" style={{ color: tier.color }}>
          {entry.topic.mastery}%
        </span>
      </div>
    </div>
  );
}
