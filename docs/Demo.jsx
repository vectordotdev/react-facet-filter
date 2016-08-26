import React, { Component } from 'react';
import Filter from '../src/index.js';

class Demo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      filters: [
        {
          category: 'user',
          option: 'Zach',
          operator: ':'
        }
      ],
      categories: [
        {
          name: 'user',
          label: 'User',
          type: 'user',
          description: 'A simple description for a user.',
          enumeration: ['Ben', 'Zach', 'Adam', 'Alex', 'Nick', 'Tim', 'David'],
          autocomplete: false
        },
        {
          name: 'location',
          label: 'Location',
          type: 'location',
          description: 'A simple description for a user.',
          enumeration: ['Ben', 'Zach', 'Adam', 'Alex', 'Nick', 'Tim', 'David'],
          autocomplete: false
        },
        {
          name: 'vehicle',
          label: 'Vehicle',
          type: 'location',
          description: 'A simple description for a user.',
          enumeration: ['Ben', 'Zach', 'Adam', 'Alex', 'Nick', 'Tim', 'David'],
          autocomplete: false
        }
      ],
      operators: ['==', '!=', 'contains', '!contains'],
      options: [
        { label: 'Ben', type: 'User' },
        { label: 'Zach', type: 'User' },
        { label: 'Adam', type: 'User' },
        { label: 'Timothy', type: 'User' }
      ],
      conditions: [],
      loading: false
    };
  }

  onAddFilter() {
    // console.log(filter);
  }

  onRemoveFilter() {
    // console.log(filter);
  }

  onFiltersChange = (filters) => {
    this.setState({
      filters
    });
  }

  fetchOptions = (query) => {
    this.setState({
      loading: true
    });

    setTimeout(() => {
      this.setState({
        options: [
          { label: 'Fetched', type: 'User' },
          { label: 'Fetched 2', type: 'User' },
          { label: 'Fetched 3', type: 'User' },
          { label: 'Fetched 4', type: 'User' }
        ],
        loading: false,
        query
      });
    }, 1500);
  }

  addFilter = () => {
    const newFilter = { category: 'category', option: 'option', operator: ':' };
    this.setState({
      filters: [...this.state.filters, newFilter]
    });
  }

  render() {
    return (
      <div className="Demo">

        <button onClick={this.addFilter}>Add Filter</button>

        <Filter
          filters={this.state.filters}
          categories={this.state.categories}
          operators={this.state.operators}
          options={this.state.options}
          conditions={this.state.conditions}
          onAddFilter={this.onAddFilter}
          onRemoveFilter={this.onRemoveFilter}
          onFiltersChange={this.onFiltersChange}
          fetchOptions={this.fetchOptions}
          loading={this.state.loading}
          threshold={2}
          noRepeat={false}
          placeholder={"Search for something..."}
        />

      </div>
    );
  }
}

export default Demo;
