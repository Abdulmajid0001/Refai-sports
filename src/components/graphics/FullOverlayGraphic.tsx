import { X } from "lucide-react";

interface Props {
  payload: Record<string, any>;
  onDismiss: () => void;
}

export function FullOverlayGraphic({ payload, onDismiss }: Props) {
  const { content, headline, subHeadline, logo, backgroundColor, textColor, imageUrl } = payload;

  return (
    <div className="fixed inset-0 z-150 bg-black/80 backdrop-blur-sm" onClick={onDismiss}>
      <div className="h-full w-full flex items-center justify-center p-4">
        <div
          className="max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: backgroundColor || "#0f172a" }}
        >
          {imageUrl && (
            <div className="w-full h-48 bg-gradient-to-b from-transparent to-black/50">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8 text-center" style={{ color: textColor || "#ffffff" }}>
            {logo && (
              <img src={logo} alt="" className="w-16 h-16 mx-auto mb-4 rounded-lg" />
            )}

            {headline && (
              <h1 className="text-4xl font-bold mb-2">{headline}</h1>
            )}

            {subHeadline && (
              <p className="text-xl opacity-80 mb-4">{subHeadline}</p>
            )}

            {content && (
              <p className="text-base opacity-70">{content}</p>
            )}
          </div>

          <div className="p-4 text-center">
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
