import React, {
  Component,
  PropTypes,
} from 'react'
import {
  Editor,
  Modifier,
  Entity,
  EditorState,
  ContentState,
  SelectionState,
  CompositeDecorator,
} from 'draft-js'

function getContentState(filters) {
  let contentState = ContentState.createFromText(
    filters.map(({ category, operator='', option='' }) => `${category}${operator}${option}`).join(' ')
  );
  const contentBlock = contentState.getFirstBlock();
  //
  let anchorOffset = 0;
  let focusOffset = 0;
  filters.forEach(({ category, operator='', option='' }) => {
    [['CATEGORY', category], ['OPERATOR', operator], ['OPTION', option]].forEach(([type, it]) => {
      if (!it) {
        return;
      }
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
  return contentState;
}

function getDecorator() {
  return new CompositeDecorator([
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'CATEGORY'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid green' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'OPERATOR'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid red' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'OPTION'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid blue' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'AUTOCOMPLETE_OPTIONS'
            );
          },
          callback
        );
      },
      component(props) {
        // TODO: render dropdown for auto-complete here
        const {query} = Entity.get(props.entityKey).getData();
        return (
          <span data-query={query} style={{ border: '5px solid blue' }}>
            {props.children}
          </span>
        );
      },
    },
  ]);
}

function mapEtitorState(prevEditorState, nextEditorState) {
  const prevFirstBlock = prevEditorState.getCurrentContent().getFirstBlock();
  const nextFirstBlock = nextEditorState.getCurrentContent().getFirstBlock();
  const expectingEntityType = 'AUTOCOMPLETE_OPTIONS';
  //
  let query = '';
  nextFirstBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      Entity.get(entityKey).getType() === 'AUTOCOMPLETE_OPTIONS'
    );
  }, (start, end) => {
    query = nextFirstBlock.getText().slice(start,end);
  });
  let entityKey = prevFirstBlock.getEntityAt(prevFirstBlock.getLength() - 1);
  if (prevFirstBlock.getLength() >= nextFirstBlock.getLength() ||
      (entityKey && Entity.get(entityKey).getType() === expectingEntityType)) {
    console.log('update-query');
    if (entityKey) {
      Entity.mergeData(entityKey, {
        query,
      });
    }
    return nextEditorState;
  } else {
    console.log('apply-entity');
    const prevSelection = prevEditorState.getSelection();
    const nextSelection = nextEditorState.getSelection();
    query = nextFirstBlock.getText().slice(
      prevSelection.getStartOffset(),
      nextSelection.getEndOffset()
    );
    entityKey = Entity.create(expectingEntityType, 'MUTABLE', { query });
    const nextContentState = Modifier.applyEntity(
      nextEditorState.getCurrentContent(),
      SelectionState
        .createEmpty(nextFirstBlock.getKey())
        .set('anchorOffset', prevSelection.getStartOffset())
        .set('focusOffset', nextSelection.getEndOffset()),
      entityKey
    );
    return EditorState.moveFocusToEnd(
      EditorState.push(
        nextEditorState,
        nextContentState,
        'apply-entity'
      )
    );
  }
}

class FacetFilter extends Component {

  static propTypes = {
    filters: PropTypes.array(
      PropTypes.shape({
        category: PropTypes.string.isRequired,
        operator: PropTypes.string,
        option: PropTypes.string,
      })
    ).isRequired,
    onFiltersChange: PropTypes.func.isRequired,
  };

  state = {
    editorState: EditorState.moveSelectionToEnd(
      EditorState.createWithContent(
        getContentState(this.props.filters),
        getDecorator()
      )
    ),
  };

  handleEditorRef = (editor) => { this.editor = editor; };
  focus = () => this.editor.focus();
  onChange = (editorState) => this.setState({ editorState: mapEtitorState(this.state.editorState, editorState) });
  logState = () => console.log(this.state.editorState.toJS(), this.state.editorState.getSelection().toJS());

  // TODO: Link CWRP for new filters
  // TODO: Link state changes for onFiltersChange

  render() {
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


class DraftjsPOCDemo extends Component {
  state = {
    filters: [
      {
        category: 'category',
        operator: ':',
        option: 'option',
      },
      {
        category: 'category2th',
        operator: '=>',
        option: undefined,
      },
    ],
  };

  handleFiltersChange = (filters) => this.setState({ filters });

  render() {
    return (
      <div>
        <FacetFilter
          filters={this.state.filters}
          onFiltersChange={this.handleFiltersChange}
        />
      </div>
    );
  }
}

export default DraftjsPOCDemo
