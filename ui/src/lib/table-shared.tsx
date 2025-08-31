import {capitalize, type SortOrder} from "./table.ts";
import {TableSortLabel} from "@mui/material";


interface TableLabelWithSortProps {
    label: string,
    activeLabel: string,
    handleSort: (label: string) => void,
    sortOrder: SortOrder
}


export const TableLabelWithSort = ({activeLabel, sortOrder, handleSort, label}: TableLabelWithSortProps) => {
    const active = activeLabel === label;

    return (
        <TableSortLabel
            active={active}
            direction={active ? sortOrder : "asc"}
            onClick={() => handleSort(label)}
        >
            {capitalize(label)}
        </TableSortLabel>
    );
};
