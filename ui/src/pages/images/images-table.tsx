import React, {useState} from 'react';
import {
    Box,
    Checkbox,
    Chip,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
    Typography
} from '@mui/material';
import {CalendarToday as CalendarIcon, Tag as TagIcon} from '@mui/icons-material';
import {getImageHomePageUrl} from "../../hooks/docker-images.ts";
import {formatBytes} from "../../lib/editor.ts";
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import {useCopyButton} from "../../hooks/copy.ts";
import type {Image} from "../../gen/docker/v1/docker_pb.ts";
import CopyButton from "../../components/copy-button.tsx";
import {formatDate} from "../../lib/api.ts";


type SortField = 'name' | 'size' | 'sharedSize' | 'containers' | 'created';
type SortOrder = 'asc' | 'desc';

interface ImageTableProps {
    images: Image[]
    selectedImages: string[],
    onSelectionChange: (selectedIds: string[]) => void,
}

export const ImageTable = (
    {
        selectedImages,
        onSelectionChange,
        images
    }: ImageTableProps
) => {
    const [sortField, setSortField] = useState<SortField>('size');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Sort images based on current sort field and order
    const sortedImages = [...images].sort((a, b) => {
        let aValue: unknown, bValue: unknown;

        switch (sortField) {
            case 'name': {
                aValue = a.repoTags[0] || 'untagged';
                bValue = b.repoTags[0] || 'untagged';
                const comparison = (aValue as string).localeCompare(bValue as string);
                return sortOrder === 'asc' ? comparison : -comparison;
            }
            case 'size':
                aValue = a.size;
                bValue = b.size;
                break;
            case 'sharedSize':
                aValue = a.sharedSize;
                bValue = b.sharedSize;
                break;
            case 'containers':
                aValue = a.containers;
                bValue = b.containers;
                break;
            case 'created':
                aValue = a.created;
                bValue = b.created;
                break;
            default:
                return 0;
        }

        // Handle bigint sorting
        let result: number;

        if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
            // Convert bigint comparison to number
            if (aValue < bValue) result = -1;
            else if (aValue > bValue) result = 1;
            else result = 0;
        } else {
            // Handle regular number comparison
            const numA = Number(aValue);
            const numB = Number(bValue);
            result = numA - numB;
        }

        return sortOrder === 'asc' ? result : -result;
    });

    // Handle individual row selection
    const handleRowSelection = (imageId: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedImages.includes(imageId)
            ? selectedImages.filter(id => id !== imageId)
            : [...selectedImages, imageId];

        onSelectionChange(newSelection);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedImages.length === images.length;
        const newSelection = allSelected ? [] : images.map(img => img.id);
        onSelectionChange(newSelection);
    };

    const isAllSelected = selectedImages.length === images.length && images.length > 0;
    const isIndeterminate = selectedImages.length > 0 && selectedImages.length < images.length;

    const {handleCopy, copiedId} = useCopyButton()

    const tableInfo = [
        {
            header: (
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={isIndeterminate}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                    />
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell padding="checkbox">
                    <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onChange={() => handleRowSelection(image.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold'}}>
                    <TableSortLabel
                        active={sortField === 'name'}
                        direction={sortField === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                    >
                        Images
                    </TableSortLabel>
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Box sx={{flex: 0.6}}>
                            {image.repoTags.length > 0 ? (
                                <Tooltip title="Open image website" arrow>
                                    <Link
                                        href={getImageHomePageUrl(image.repoTags[0])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{textDecoration: 'none', color: 'primary.main'}}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <Typography variant="body2" component="span" sx={{
                                            wordBreak: 'break-all',
                                            '&:hover': {textDecoration: 'underline'}
                                        }}>
                                            {image.repoTags[0]}
                                        </Typography>
                                    </Link>
                                </Tooltip>
                            ) : (
                                <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                    Untagged
                                </Typography>
                            )}
                        </Box>
                        <CopyButton
                            tooltip={"Copy image ID"}
                            handleCopy={handleCopy}
                            thisID={image.id}
                            activeID={copiedId ?? ""}
                        />
                    </Box>
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                    <TableSortLabel
                        active={sortField === 'containers'}
                        direction={sortField === 'containers' ? sortOrder : 'asc'}
                        onClick={() => handleSort('containers')}
                    >
                        Containers
                    </TableSortLabel>
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    {Number(image.containers) > 0 ? (
                        <Chip
                            label={`${Number(image.containers)} using`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    ) : (
                        <Chip
                            label={`Unused ${Number(image.containers)}`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    )}
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                    <TableSortLabel
                        active={sortField === 'size'}
                        direction={sortField === 'size' ? sortOrder : 'asc'}
                        onClick={() => handleSort('size')}
                    >
                        Size
                    </TableSortLabel>
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                        {formatBytes(image.size)}
                    </Typography>
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                    <TableSortLabel
                        active={sortField === 'sharedSize'}
                        direction={sortField === 'sharedSize' ? sortOrder : 'asc'}
                        onClick={() => handleSort('sharedSize')}
                    >
                        Shared Size
                    </TableSortLabel>
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    <Typography variant="body2">
                        {Number(image.sharedSize) > 0 ? formatBytes(image.sharedSize) : '—'}
                    </Typography>
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                    Tags
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{flexWrap: 'wrap', gap: 0.5}}>
                        {image.repoTags.length > 1 ? (
                            <>
                                {image.repoTags.slice(1, 3).map((tag, idx) => (
                                    <Chip
                                        key={idx}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        icon={<TagIcon/>}
                                        sx={{fontSize: '0.75rem'}}
                                    />
                                ))}
                                {image.repoTags.length > 3 && (
                                    <Chip
                                        label={`+${image.repoTags.length - 3} more`}
                                        size="small"
                                        variant="outlined"
                                        sx={{fontSize: '0.75rem'}}
                                    />
                                )}
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                —
                            </Typography>
                        )}
                    </Stack>
                </TableCell>
            )
        },
        {
            header: (
                <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                    <TableSortLabel
                        active={sortField === 'created'}
                        direction={sortField === 'created' ? sortOrder : 'asc'}
                        onClick={() => handleSort('created')}
                    >
                        Created
                    </TableSortLabel>
                </TableCell>
            ),
            cell: (image: Image) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
                        <Typography variant="body2">
                            {formatDate(image.created)}
                        </Typography>
                    </Box>
                </TableCell>
            )
        }
    ];

    return (
        <TableContainer
            component={Paper}
            sx={{
                height: '100%',
                overflow: 'auto',
                ...scrollbarStyles
            }}
        >
            <Table stickyHeader sx={{minWidth: 650}}>
                <TableHead>
                    <TableRow>
                        {tableInfo.map((column, index) => (
                            <React.Fragment key={index}>
                                {column.header}
                            </React.Fragment>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody
                    sx={{
                        // opacity: loading ? 1 : 0,
                        // transition: 'opacity 200ms ease-in-out',
                    }}
                >
                    {sortedImages.map((image) => (
                        <TableRow
                            key={image.id}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': {border: 0},
                                cursor: 'pointer',
                                backgroundColor: selectedImages.includes(image.id)
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'transparent'
                            }}
                            onClick={() => handleRowSelection(image.id)}
                        >
                            {tableInfo.map((column, index) => (
                                <React.Fragment key={index}>
                                    {column.cell(image)}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
