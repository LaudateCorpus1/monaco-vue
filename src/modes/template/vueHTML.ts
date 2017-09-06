import IWorkerContext = monaco.worker.IWorkerContext;

import { LanguageModelCache, getLanguageModelCache } from '../languageModelCache';
import { DocumentContext } from '../../languageService';
import { TextDocument, Position, Range, FormattingOptions } from 'vscode-languageserver-types';
import { LanguageMode } from '../languageModes';
import { VueDocumentRegions } from '../embeddedSupport';

import { HTMLDocument } from './parser/htmlParser';
import { doComplete } from './services/htmlCompletion';
import { doHover } from './services/htmlHover';
import { findDocumentHighlights } from './services/htmlHighlighting';
import { findDocumentLinks } from './services/htmlLinks';
import { findDocumentSymbols } from './services/htmlSymbolsProvider';
// import { htmlFormat } from './services/formatters';
import { parseHTMLDocument } from './parser/htmlParser';
// import { doValidation, createLintEngine } from './services/htmlValidation';
import { getDefaultSetting } from './tagProviders';
import { ScriptMode } from '../javascriptMode';
import { getComponentTags, getBasicTagProviders } from './tagProviders';

export type DocumentRegionCache = LanguageModelCache<VueDocumentRegions>;

export function getVueHTMLMode(
  documentRegions: DocumentRegionCache,
  _ctx: IWorkerContext,
  scriptMode: ScriptMode): LanguageMode {
  let settings: any = {};
  let completionOption = getDefaultSetting(null); //TODO
  let basicTagProviders = getBasicTagProviders(completionOption);
  const embeddedDocuments = getLanguageModelCache<TextDocument>(10, 60, document => documentRegions.get(document).getEmbeddedDocument('vue-html'));
  const vueDocuments = getLanguageModelCache<HTMLDocument>(10, 60, document => parseHTMLDocument(document));
//   const lintEngine = createLintEngine();

  return {
    getId() {
      return 'vue-html';
    },
    configure(options: any) {
      settings = options && options.html;
      completionOption = settings && settings.suggest || getDefaultSetting(null);
      basicTagProviders = getBasicTagProviders(completionOption);
    },
    doValidation(document) {
	  const embedded = embeddedDocuments.get(document);
	  return null;
    //   return doValidation(embedded, lintEngine);
    },
    doComplete(document: TextDocument, position: Position) {
      const embedded = embeddedDocuments.get(document);
      const components = scriptMode.findComponents(document);
      const tagProviders = basicTagProviders.concat(getComponentTags(components));
      return doComplete(embedded, position, vueDocuments.get(embedded), tagProviders);
    },
    doHover(document: TextDocument, position: Position) {
      const embedded = embeddedDocuments.get(document);
      const components = scriptMode.findComponents(document);
      const tagProviders = basicTagProviders.concat(getComponentTags(components));
      return doHover(embedded, position, vueDocuments.get(embedded), tagProviders);
    },
    findDocumentHighlight(document: TextDocument, position: Position) {
      return findDocumentHighlights(document, position, vueDocuments.get(document));
    },
    findDocumentLinks(document: TextDocument, documentContext: DocumentContext) {
      return findDocumentLinks(document, documentContext);
    },
    findDocumentSymbols(document: TextDocument) {
      return findDocumentSymbols(document, vueDocuments.get(document));
    },
    format(document: TextDocument, range: Range, formattingOptions: FormattingOptions) {
	//   return htmlFormat(document, range, formattingOptions);
		return null;
    },
    onDocumentRemoved(document: TextDocument) {
      vueDocuments.onDocumentRemoved(document);
    },
    dispose() {
      vueDocuments.dispose();
    }
  };
}
