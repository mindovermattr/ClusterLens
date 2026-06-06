import type { EventLogEntry } from "../domain/types";
import { formatDurationMs } from "../domain/selectors";

type EventLogPanelProps = {
  entries: EventLogEntry[];
};

export function EventLogPanel({ entries }: EventLogPanelProps) {
  return (
    <section className="panel event-panel" aria-labelledby="events-heading">
      <div className="panel-header">
        <h2 id="events-heading">Event Log</h2>
        <span>{entries.length} entries</span>
      </div>

      <div className="event-table" role="table" aria-label="Event log">
        <div className="event-row event-row-heading" role="row">
          <span role="columnheader">Time</span>
          <span role="columnheader">Type</span>
          <span role="columnheader">Source</span>
          <span role="columnheader">Target</span>
          <span role="columnheader">Message</span>
        </div>
        {entries.length ? (
          entries
            .map((entry, originalIndex) => ({ entry, originalIndex }))
            .reverse()
            .map(({ entry, originalIndex }) => (
              <div
                className="event-row"
                role="row"
                key={`${entry.timestampMs}-${entry.eventType}-${entry.source ?? "none"}-${entry.target ?? "none"}-${entry.message}-${originalIndex}`}
              >
                <span role="cell">{formatDurationMs(entry.timestampMs)}</span>
                <span role="cell">{entry.eventType}</span>
                <span role="cell">{entry.source ?? "-"}</span>
                <span role="cell">{entry.target ?? "-"}</span>
                <span role="cell">{entry.message}</span>
              </div>
            ))
        ) : (
          <p className="empty-state">Waiting for events.</p>
        )}
      </div>
    </section>
  );
}
