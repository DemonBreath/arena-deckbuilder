import type { ClassId } from '../game/classDatabase'
import { getMechanicDisplay } from '../game/classMechanics'
import type { ClassMechanicMeter } from '../types/classMechanic'

interface ClassMechanicMeterProps {
  classId: ClassId
  meter: ClassMechanicMeter
  /** Tighter layout inside fighter panels. */
  compact?: boolean
}

export function ClassMechanicMeter({
  classId,
  meter,
  compact = false,
}: ClassMechanicMeterProps) {
  const display = getMechanicDisplay(meter, classId)

  return (
    <div
      className={`class-mechanic-meter ${compact ? 'class-mechanic-meter--compact' : ''}`}
      title={display.hint}
      aria-label={`${display.name} ${display.value} of ${display.max}. ${display.hint}`}
    >
      <div className="class-mechanic-meter__header">
        <span className="class-mechanic-meter__name">{display.name}</span>
        <span className="class-mechanic-meter__value">
          {display.value} / {display.max}
        </span>
      </div>
      <div
        className="class-mechanic-meter__track"
        role="progressbar"
        aria-valuenow={display.value}
        aria-valuemin={0}
        aria-valuemax={display.max}
        aria-label={display.name}
      >
        <div
          className={`class-mechanic-meter__fill class-mechanic-meter__fill--${display.id}${
            display.thresholdActive ? ' class-mechanic-meter__fill--charged' : ''
          }`}
          style={{ width: `${display.percent}%` }}
        />
      </div>
      {!compact && display.thresholdAt !== undefined && (
        <p className="class-mechanic-meter__hint">
          {display.thresholdActive
            ? `Bonus active (${display.thresholdAt}+)`
            : `Bonus at ${display.thresholdAt}+`}
        </p>
      )}
    </div>
  )
}
