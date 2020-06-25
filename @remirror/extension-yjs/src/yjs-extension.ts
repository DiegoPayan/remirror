import {
  CustomHandlerKeyList,
  DefaultExtensionOptions,
  HandlerKeyList,
  PlainExtension,
  StaticKeyList,
  convertCommand,
  invariant,
} from '@remirror/core';
import { redo, undo, yCursorPlugin, ySyncPlugin, yUndoPlugin } from 'y-prosemirror';
import { Doc } from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Observable } from 'lib0/observable';
import { css } from 'linaria';

/**
 * yjs typings are very rough; so we define here the interface that we require
 * (y-webrtc and y-websocket providers are both compatible with this interface;
 * no other providers have been checked).
 */
interface YjsRealtimeProvider extends Observable<string> {
  doc: Doc;
  awareness: any;
}

export interface YjsOptions {
  getProvider: () => YjsRealtimeProvider;
}

/**
 * An extension for the remirror editor. CHANGE ME.
 */
export class YjsExtension extends PlainExtension<YjsOptions> {
  static readonly staticKeys: StaticKeyList<YjsOptions> = [];
  static readonly handlerKeys: HandlerKeyList<YjsOptions> = [];
  static readonly customHandlerKeys: CustomHandlerKeyList<YjsOptions> = [];
  private provider: YjsRealtimeProvider | null = null;

  static readonly defaultOptions: DefaultExtensionOptions<YjsOptions> = {
    // DEFINITELY OVERRIDE THIS!
    getProvider: () => new WebrtcProvider('global', new Doc(), {}),
  };

  get name() {
    return 'yjs' as const;
  }

  createKeymap = () => {
    return {
      'Mod-z': convertCommand(undo),
      'Mod-y': convertCommand(redo),
      'Mod-Shift-z': convertCommand(redo),
    };
  };

  createExternalPlugins = () => {
    const { getProvider } = this.options;
    if (!this.provider) {
      this.provider = getProvider();
    }
    invariant(this.provider, { message: 'Provider should be set' });
    const { provider } = this;
    const ydoc = provider.doc;
    const type = ydoc.getXmlFragment('prosemirror');
    return [ySyncPlugin(type), yCursorPlugin(provider.awareness), yUndoPlugin()];
  };
}

/**
 * @remarks
 * This magic property is transformed by babel via linaria into CSS that will
 * be wrapped by the `.remirror-editor` class; when you edit it you must run
 * `yarn fix:css` to regenerate `@remirror/styles/all.css`.
 */
export const editorStyles = css`
  placeholder {
    display: inline;
    border: 1px solid #ccc;
    color: #ccc;
  }
  placeholder:after {
    content: '☁';
    font-size: 200%;
    line-height: 0.1;
    font-weight: bold;
  }
  .ProseMirror img {
    max-width: 100px;
  }
  /* this is a rough fix for the first cursor position when the first paragraph is empty */
  .ProseMirror > .ProseMirror-yjs-cursor:first-child {
    margin-top: 16px;
  }
  .ProseMirror p:first-child,
  .ProseMirror h1:first-child,
  .ProseMirror h2:first-child,
  .ProseMirror h3:first-child,
  .ProseMirror h4:first-child,
  .ProseMirror h5:first-child,
  .ProseMirror h6:first-child {
    margin-top: 16px;
  }
  .ProseMirror-yjs-cursor {
    position: absolute;
    border-left: black;
    border-left-style: solid;
    border-left-width: 2px;
    border-color: orange;
    height: 1em;
    word-break: normal;
    pointer-events: none;
  }
  .ProseMirror-yjs-cursor > div {
    position: relative;
    top: -1.05em;
    font-size: 13px;
    background-color: rgb(250, 129, 0);
    font-family: serif;
    font-style: normal;
    font-weight: normal;
    line-height: normal;
    user-select: none;
    color: white;
    padding-left: 2px;
    padding-right: 2px;
  }
  #y-functions {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  #y-functions > * {
    display: inline-block;
  }
`;
