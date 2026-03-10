import { z } from "zod";

const issueStatusEnum   = z.enum(["open", "in_progress", "resolved", "closed"]);
const issuePriorityEnum = z.enum(["low", "medium", "high"]);
const issueCategoryEnum = z.enum(["billing", "meter", "connection", "other"]);

// -------------------------------------------
// Create Issue
// -------------------------------------------
export const createIssueSchema = z.object({
    subscriber_id: z.string().uuid().optional(),
    title:         z.string().trim().min(1).max(500),
    description:   z.string().trim().max(5000).optional(),
    category:      issueCategoryEnum.default("other"),
    priority:      issuePriorityEnum.default("medium"),
});

// -------------------------------------------
// Update Issue
// -------------------------------------------
export const updateIssueSchema = z.object({
    title:       z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    category:    issueCategoryEnum.optional(),
    priority:    issuePriorityEnum.optional(),
    status:      issueStatusEnum.optional(),
    assigned_to: z.string().uuid().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// -------------------------------------------
// Query Params
// -------------------------------------------
export const issueQuerySchema = z.object({
    page:     z.coerce.number().int().min(1).default(1),
    limit:    z.coerce.number().int().min(1).max(100).default(10),
    search:   z.string().optional(),
    status:   issueStatusEnum.optional(),
    priority: issuePriorityEnum.optional(),
    category: issueCategoryEnum.optional(),
});

export type CreateIssueInput  = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput  = z.infer<typeof updateIssueSchema>;
export type IssueQueryParams  = z.infer<typeof issueQuerySchema>;
