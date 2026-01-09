<template>
  <div class="filter-bar">
    <div class="filter-controls">
      <div class="filter-group">
        <label for="status-filter">Status</label>
        <select
          id="status-filter"
          :value="taskStore.filters.status || ''"
          name="status-filter"
          @change="(e) => taskStore.setFilter('status', (e.target as HTMLSelectElement).value || null)"
        >
          <option value="">
            All Statuses
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="in_progress">
            In Progress
          </option>
          <option value="completed">
            Completed
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="priority-filter">Priority</label>
        <select
          id="priority-filter"
          :value="taskStore.filters.priority || ''"
          name="priority-filter"
          @change="(e) => taskStore.setFilter('priority', (e.target as HTMLSelectElement).value || null)"
        >
          <option value="">
            All Priorities
          </option>
          <option value="low">
            Low
          </option>
          <option value="medium">
            Medium
          </option>
          <option value="high">
            High
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="category-filter">Category</label>
        <select
          id="category-filter"
          :value="taskStore.filters.category_id || ''"
          data-testid="category-filter"
          @change="(e) => taskStore.setFilter('category_id', (e.target as HTMLSelectElement).value || null)"
        >
          <option value="">
            All Categories
          </option>
          <option
            v-for="category in categoryStore.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="filter-group search">
        <label for="search-filter">Search</label>
        <input
          id="search-filter"
          type="text"
          :value="taskStore.filters.search || ''"
          placeholder="Search tasks..."
          @input="(e) => taskStore.setFilter('search', (e.target as HTMLInputElement).value || null)"
        >
      </div>

      <button
        class="btn-clear-filters"
        @click="clearAllFilters"
      >
        Clear All
      </button>
    </div>

    <div
      v-if="hasActiveFilters"
      class="active-filters"
    >
      <span class="filters-label">Active filters:</span>
      <div
        v-if="taskStore.filters.status"
        class="filter-tag"
      >
        Status: {{ formatLabel(taskStore.filters.status) }}
        <button
          class="btn-remove"
          @click="clearFilter('status')"
        >
          ✕
        </button>
      </div>
      <div
        v-if="taskStore.filters.priority"
        class="filter-tag"
      >
        Priority: {{ formatLabel(taskStore.filters.priority) }}
        <button
          class="btn-remove"
          @click="clearFilter('priority')"
        >
          ✕
        </button>
      </div>
      <div
        v-if="taskStore.filters.category_id"
        class="filter-tag"
      >
        Category: {{ getCategoryName(taskStore.filters.category_id) }}
        <button
          class="btn-remove"
          @click="clearFilter('category_id')"
        >
          ✕
        </button>
      </div>
      <div
        v-if="taskStore.filters.search"
        class="filter-tag"
      >
        Search: "{{ taskStore.filters.search }}"
        <button
          class="btn-remove"
          @click="clearFilter('search')"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '../stores/task'
import { useCategoryStore } from '../stores/category'

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()

const hasActiveFilters = computed(() => {
  return (
    taskStore.filters.status ||
    taskStore.filters.priority ||
    taskStore.filters.category_id ||
    taskStore.filters.search
  )
})

const formatLabel = (text: string): string => {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getCategoryName = (categoryId: string): string => {
  const category = categoryStore.getCategory(categoryId)
  return category?.name || 'Unknown'
}

const clearFilter = (filterKey: string) => {
  taskStore.setFilter(filterKey, null)
}

const clearAllFilters = () => {
  taskStore.clearFilters()
}
</script>

<style scoped>
.filter-bar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-group select,
.filter-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  font-family: inherit;
  transition: all 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-group.search {
  grid-column: auto;
}

.btn-clear-filters {
  padding: 0.75rem 1.5rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
  align-self: flex-end;
}

.btn-clear-filters:hover {
  background-color: #da190b;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.filters-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 0.4rem 0.8rem;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin-left: 0.25rem;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}

.btn-remove:hover {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }

  .btn-clear-filters {
    width: 100%;
    align-self: stretch;
  }

  .active-filters {
    gap: 0.5rem;
  }

  .filters-label {
    width: 100%;
  }
}
</style>
