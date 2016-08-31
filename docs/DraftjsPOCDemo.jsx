import React from 'react'
import {
  Editor,
  Modifier,
  Entity,
  EditorState,
  ContentState,
  SelectionState,
} from 'draft-js'

function getEditorState() {
  let contentState = ContentState.createFromText('category:option');
  const contentBlock = contentState.getFirstBlock();
  //
  let selectionState = SelectionState
    .createEmpty(contentBlock.getKey())
    .set('anchorOffset', 0)
    .set('focusOffset', 'category'.length);

  contentState = Modifier.applyEntity(
    contentState,
    selectionState,
    Entity.create('CATEGORY', 'IMMUTABLE', {})
  );
  //
  selectionState = SelectionState
    .createEmpty(contentBlock.getKey())
    .set('anchorOffset', 'category'.length)
    .set('focusOffset', 'category:'.length);

  contentState = Modifier.applyEntity(
    contentState,
    selectionState,
    Entity.create('OPERATOR', 'IMMUTABLE', {})
  );
  //
  selectionState = SelectionState
    .createEmpty(contentBlock.getKey())
    .set('anchorOffset', 'category:'.length)
    .set('focusOffset', 'category:option'.length);

  contentState = Modifier.applyEntity(
    contentState,
    selectionState,
    Entity.create('OPTION', 'IMMUTABLE', {})
  );

  return EditorState.createWithContent(contentState);
}

class DraftjsPOCDemo extends React.Component {

  state = {
    editorState: getEditorState(),
  };

  handleEditorRef = (editor) => { this.editor = editor; };
  focus = () => this.editor.focus();
  onChange = (editorState) => this.setState({ editorState });
  logState = () => console.log(this.state.editorState.toJS());

  render() {
    return (
      <div style={styles.root}>
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            ref={this.handleEditorRef}
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="Write a tweet..."
            spellCheck
          />
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
    width: 600,
  },
  editor: {
    border: '1px solid #ddd',
    cursor: 'text',
    fontSize: 16,
    minHeight: 40,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: 'center',
  },
};

export default DraftjsPOCDemo
