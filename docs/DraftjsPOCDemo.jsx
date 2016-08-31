import React from 'react'
import {
  Editor,
  EditorState
} from 'draft-js'

class DraftjsPOCDemo extends React.Component {

  state = {
    editorState: EditorState.createEmpty(),
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
