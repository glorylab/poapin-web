import { atom } from 'jotai';

// Filter state atoms
export const filterStateAtom = atom<{ [key: string]: string[] }>({});

// Sort state atom
export const sortStateAtom = atom<string>('collected_newest');

// Derived atom to check if filters are active
export const hasActiveFiltersAtom = atom((get) => {
    const filters = get(filterStateAtom);
    return Object.values(filters).some(values => values.length > 0);
});

// Derived atom to get total active filter count
export const activeFilterCountAtom = atom((get) => {
    const filters = get(filterStateAtom);
    return Object.values(filters).reduce((count, values) => count + values.length, 0);
});
