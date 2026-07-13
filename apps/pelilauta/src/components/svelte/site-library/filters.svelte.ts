interface Filters {
  orderBy: 'name' | 'flowTime';
  orderDirection: 'asc' | 'desc';
}

export function toggleOrder() {
  filters.orderDirection = filters.orderDirection === 'asc' ? 'desc' : 'asc';
}

export const filters: Filters = $state({
  orderBy: 'flowTime',
  orderDirection: 'desc',
});
