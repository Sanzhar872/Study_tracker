interface Props {
  title: string;
  isMobile: boolean;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

export default function PeriodHeader({ title, isMobile, onPrev, onToday, onNext }: Props) {
  return (
    <div className="week-header">
      <h2 className="week-header-title">{title}</h2>
      <div className="week-nav-btns">
        <button
          className="icon-btn"
          onClick={onPrev}
          title={isMobile ? "Предыдущий день" : "Предыдущая неделя"}
        >
          ←
        </button>
        <button className="icon-btn" onClick={onToday} title="Сегодня">
          •
        </button>
        <button
          className="icon-btn"
          onClick={onNext}
          title={isMobile ? "Следующий день" : "Следующая неделя"}
        >
          →
        </button>
      </div>
    </div>
  );
}
