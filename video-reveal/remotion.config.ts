import { Config } from "@remotion/cli/config";

Config.setChromiumOpenGlRenderer("angle");
Config.setBrowserExecutable(" chromium");
Config.setMaxConcurrency(3);

// Set video resolution
Config.setVideoImageFormat("jpeg");
Config.setQuality(90);

export default Config;