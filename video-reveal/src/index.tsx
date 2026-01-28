import { Composition, registerRoot } from "remotion";
import { VideoReveal } from "./VideoReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoReveal"
        component={VideoReveal}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
