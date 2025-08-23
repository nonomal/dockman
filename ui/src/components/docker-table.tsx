// import React, { JSX, useState } from 'react';
// import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
// import scrollbarStyles from "../../components/scrollbar-style.tsx";
//
// type SortOrder = 'asc' | 'desc';
// type SortField<T> = keyof T | ((item: T) => string | number | Date);
//
// export interface ColumnDefinition<T> {
//     key: keyof T;
//     header: (sort: (field: keyof T) => void) => JSX.Element;
//     body: (item: T) => JSX.Element;
// }
//
// interface DockerTableProps<T> {
//     inputData: T[];
//     columns: ColumnDefinition<T>[];
// }
//
// export const DockerTable = <T,>({ inputData, columns }: DockerTableProps<T>) => {
//     const [sortField, setSortField] = useState<keyof T>(columns[0]?.key);
//     const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
//
//     const handleSort = (field: keyof T) => {
//         if (sortField === field) {
//             setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//         } else {
//             setSortField(field);
//             setSortOrder('asc');
//         }
//     };
//
//     const sortedData = [...inputData].sort((a, b) => genericSort(a, b, sortField, sortOrder));
//
//     return (
//         <TableContainer
//             component={Paper}
//             sx={{ height: '100%', overflow: 'auto', ...scrollbarStyles }}
//         >
//             <Table stickyHeader sx={{ minWidth: 650 }}>
//                 <TableHead>
//                     <TableRow>
//                         {columns.map((col) => (
//                             <React.Fragment key={String(col.key)}>
//                                 {col.header(handleSort)}
//                             </React.Fragment>
//                         ))}
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {sortedData.map((item, rowIndex) => (
//                         <TableRow key={rowIndex}>
//                             {columns.map((col) => (
//                                 <TableCell key={String(col.key)}>
//                                     {col.body(item)}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     ))}
//                 </TableBody>
//             </Table>
//         </TableContainer>
//     );
// };
//
// function genericSort<T>(
//     a: T,
//     b: T,
//     sortField: SortField<T>,
//     sortOrder: SortOrder
// ): number {
//     let aValue: string | number | Date;
//     let bValue: string | number | Date;
//
//     if (typeof sortField === 'function') {
//         aValue = sortField(a);
//         bValue = sortField(b);
//     } else {
//         aValue = a[sortField];
//         bValue = b[sortField];
//     }
//
//     let result: number;
//
//     if (typeof aValue === 'string' && typeof bValue === 'string') {
//         result = aValue.localeCompare(bValue);
//     } else if (aValue instanceof Date && bValue instanceof Date) {
//         result = aValue.getTime() - bValue.getTime();
//     } else {
//         result = (aValue as number) - (bValue as number);
//     }
//
//     return sortOrder === 'asc' ? result : -result;
// }
