// lib/api/submissions.ts
// API functions for submission management

import api from "../api";

export interface SubmissionUpdateData {
  status?: "pending" | "in-review" | "approved" | "rejected";
  rating?: number;
  feedback?: string;
}

export interface Submission {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  rating?: number;
  feedback?: string;
  status: "pending" | "in-review" | "approved" | "rejected";
  submittedAt: string;
  duration?: string;
  files?: string[];
  userid: string;
  users?: {
    id: string;
    name: string;
  };
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  submission_id?: string;
  updated_fields?: string[];
  email_sent?: boolean;
}

/**
 * Update submission status, rating, and feedback
 */
export async function updateSubmission(
  submissionId: string,
  updateData: SubmissionUpdateData
): Promise<ApiResponse<Submission>> {
  try {
    const response = await api.put(`/submissions/${submissionId}`, updateData);
    return response;
  } catch (error) {
    console.error("Error updating submission:", error);
    throw error;
  }
}

/**
 * Get submission by ID
 */
export async function getSubmission(
  submissionId: string
): Promise<{ submission: Submission }> {
  try {
    const response = await api.get(`/submissions/${submissionId}`);
    return response;
  } catch (error) {
    console.error("Error getting submission:", error);
    throw error;
  }
}

/**
 * Update only the status of a submission
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: "pending" | "in-review" | "approved" | "rejected"
): Promise<ApiResponse<Submission>> {
  return updateSubmission(submissionId, { status });
}

/**
 * Update only the rating of a submission
 */
export async function updateSubmissionRating(
  submissionId: string,
  rating: number
): Promise<ApiResponse<Submission>> {
  return updateSubmission(submissionId, { rating });
}

/**
 * Update only the feedback of a submission
 */
export async function updateSubmissionFeedback(
  submissionId: string,
  feedback: string
): Promise<ApiResponse<Submission>> {
  return updateSubmission(submissionId, { feedback });
}

/**
 * Update status, rating, and feedback in one call
 */
export async function updateSubmissionComplete(
  submissionId: string,
  status: "pending" | "in-review" | "approved" | "rejected",
  rating: number,
  feedback: string
): Promise<ApiResponse<Submission>> {
  return updateSubmission(submissionId, { status, rating, feedback });
}
