import React, {
  Component,
} from 'react'

import {
  FiltersEditor
} from '../lib'

export default class FiltersEditorDemo extends Component {
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

  handleFiltersChange = (filters) => {
    this.setState({ filters });
  }

  resetFilters = () => this.setState({
    filters: [
      {
        category: 'newCategory',
        operator: ':=',
        option: 'newOption',
      },
    ],
  })

  render() {
    const styles = {
      root: {
        fontFamily: '\'Helvetica\', sans-serif',
        padding: 20,
        width: 600,
        textAlign: 'left',
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
        <h4>FiltersEditor</h4>
        <pre>
          <code>{JSON.stringify(this.state.filters, null, 2)}</code>
        </pre>
        <div style={styles.editor} onClick={this.focus}>
          <FiltersEditor
            filters={this.state.filters}
            onFiltersChange={this.handleFiltersChange}
          />
        </div>
        <input
          onClick={this.resetFilters}
          style={styles.button}
          type="button"
          value="Reset filters"
        />
      </div>
    );
  }
}
