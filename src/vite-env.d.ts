/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg?react" {
  import React from 'react';
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly DEV_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
