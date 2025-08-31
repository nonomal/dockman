import {type JSX, useCallback, useEffect, useMemo, useState} from "react";
import {type DockmanYaml, FileService} from "../gen/files/v1/files_pb.ts";
import {callRPC, useClient} from "./api.ts";

export type SortOrder = 'asc' | 'desc';

export function capitalize(word: string): string {
    if (!word) return word;
    return word
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

export const useDockmanYaml = () => {
    const fs = useClient(FileService)
    const [dockYaml, setDockYaml] = useState<DockmanYaml | null>(null)

    useEffect(() => {
        const callback = async () => {
            const {val} = await callRPC(() => fs.getDockmanYaml({}))
            setDockYaml(val)
        }
        callback().then()
    }, [fs]);

    return {dockYaml};
}

type KeyOf<T> = keyof T;

export function useSelection<T>(
    items: T[],
    selectedKeys: (T[KeyOf<T>])[],
    onSelectionChange?: (newSelection: (T[KeyOf<T>])[]) => void,
    keyField: KeyOf<T> = "id" as KeyOf<T> // default to 'id'
) {
    const isAllSelected = useMemo(
        () => selectedKeys.length === items.length && items.length > 0,
        [selectedKeys, items]
    );

    const isIndeterminate = useMemo(
        () => selectedKeys.length > 0 && selectedKeys.length < items.length,
        [selectedKeys, items]
    );

    const toggleItem = useCallback(
        (value: T[KeyOf<T>]) => {
            if (!onSelectionChange) return;

            const newSelection = selectedKeys.includes(value)
                ? selectedKeys.filter(v => v !== value)
                : [...selectedKeys, value];

            onSelectionChange(newSelection);
        },
        [selectedKeys, onSelectionChange]
    );

    const toggleAll = useCallback(() => {
        if (!onSelectionChange) return;

        const newSelection = isAllSelected ? [] : items.map(item => item[keyField]);
        onSelectionChange(newSelection);
    }, [isAllSelected, items, keyField, onSelectionChange]);

    return {isAllSelected, isIndeterminate, toggleItem, toggleAll};
}

export const useSort = (initialField: string, initialSort: SortOrder = 'asc') => {
    const [sortField, setSortField] = useState<string>(initialField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    return {sortField, sortOrder, setSortOrder, handleSort};
}

export type TableInfo<T> = Record<string, TableInfoVal<T>>;

export interface TableInfoVal<T> {
    header: (label: string) => JSX.Element;
    cell: (data: T) => JSX.Element
    getValue: (data: T) => string | number | bigint | Date | boolean
}

export function sortTable<T>(
    data: T[],
    sortField: string,
    tableInfo: TableInfo<T>,
    sortOrder: SortOrder
): T[] {
    return [...data].sort((a, b) => {
            const column = tableInfo[sortField] ?? Object.values(tableInfo)[1];
            if (!column || !column.getValue) return 0;

            const aValue = column.getValue(a);
            const bValue = column.getValue(b);

            let result: number;
            if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
                // Convert bigint comparison to number
                if (aValue < bValue) {
                    result = -1;
                } else if (aValue > bValue) {
                    result = 1;
                } else {
                    result = 0;
                }
            } else if (aValue instanceof Date && bValue instanceof Date) {
                result = aValue.getTime() - bValue.getTime();
            } else if (typeof aValue === "number" && typeof bValue === "number") {
                result = aValue - bValue;
            } else {
                result = String(aValue).localeCompare(String(bValue));
            }

            return sortOrder === "asc" ? result : -result;
        }
    )
        ;

}

