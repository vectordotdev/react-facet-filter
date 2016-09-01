import React from 'react'
import {
  Editor,
  Modifier,
  Entity,
  EditorState,
  ContentState,
  SelectionState,
} from 'draft-js'

function getEditorState(filters) {
  let contentState = ContentState.createFromText(
    filters.map(({ category, operator, option }) => `${category}${operator}${option}`).join(' ')
  );
  const contentBlock = contentState.getFirstBlock();
  //
  let anchorOffset = 0;
  let focusOffset = 0;
  filters.forEach(({ category, operator, option }) => {
    [['CATEGORY', category], ['OPERATOR', operator], ['OPTION', option]].forEach(([type, it]) => {
      anchorOffset = focusOffset;
      focusOffset += it.length;

      const selectionState = SelectionState
        .createEmpty(contentBlock.getKey())
        .set('anchorOffset', anchorOffset)
        .set('focusOffset', focusOffset);

      contentState = Modifier.applyEntity(
        contentState,
        selectionState,
        Entity.create(type, 'IMMUTABLE', {})
      );
    });

    anchorOffset += 1;
    focusOffset += 1;
  });

  return EditorState.createWithContent(contentState);
}

class DraftjsPOCDemo extends React.Component {

  state = {
    editorState: getEditorState([
      {
        category: 'category',
        operator: ':',
        option: 'option',
      },
      {
        category: 'category2th',
        operator: '=>',
        option: 'option2th',
      },
    ]),
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
