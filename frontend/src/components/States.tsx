import { MODELS, MODEL_BY_ID } from "../lib/models";
import type { ModelId } from "../types";
import { SearchIcon, SparkIcon } from "./Icons";

interface Props {
  title: string;
  message: string;
  model: ModelId;
  onSwitchModel?: (m: ModelId) => void;
  onRetry?: () => void;
}

export function MessageState({ title, message, model, onSwitchModel, onRetry }: Props) {
  return (
    <div className="state">
      <div className="state-art">
        <SearchIcon size={36} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="state-actions">
        {onSwitchModel &&
          MODELS.filter((m) => m.id !== model).map((m) => (
            <button key={m.id} className="btn btn-outline" onClick={() => onSwitchModel(m.id)}>
              <SparkIcon /> Try {MODEL_BY_ID[m.id].name}
            </button>
          ))}
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
