import { rangeData } from './rangeData.ts'
export interface blockData {
    range: rangeData,
    id: string,
    type: string | null,
    value: string,
}