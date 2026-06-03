import type { Response } from "express";
import { TagInterface } from "shared/types/tag";
import { EventUserForResponseLocals } from "shared/types/events/event-types";
import { AuthRequest } from "back-end/src/types/AuthRequest";
import { ApiErrorResponse } from "back-end/types/api";
import { getContextFromReq } from "back-end/src/services/organizations";
import {
  addTag,
  bulkUpdateTagColors,
  removeTag,
} from "back-end/src/models/TagModel";
import { removeTagInMetrics } from "back-end/src/models/MetricModel";
import { removeTagInFeature } from "back-end/src/models/FeatureModel";
import { removeTagFromSlackIntegration } from "back-end/src/models/SlackIntegrationModel";
import { removeTagInAttribute } from "back-end/src/services/attributes";
import { removeTagFromExperiments } from "back-end/src/models/ExperimentModel";

// region POST /tag

type CreateTagRequest = AuthRequest<TagInterface>;

type CreateTagResponse = {
  status: 200;
};

/**
 * POST /tag
 * Create a tag resource
 * @param req
 * @param res
 */
export const postTag = async (
  req: CreateTagRequest,
  res: Response<CreateTagResponse>,
) => {
  const context = getContextFromReq(req);

  if (!context.permissions.canCreateAndUpdateTag()) {
    context.permissions.throwPermissionError();
  }
  const { id, color, description } = req.body;

  await addTag(context.org.id, id, color, description);

  res.status(200).json({
    status: 200,
  });
};

type UpdateTagColorRequest = AuthRequest<{
  tags: string[];
  color: string;
}>;

type UpdateTagColorResponse = {
  status: 200;
};

export const putTagColor = async (
  req: UpdateTagColorRequest,
  res: Response<UpdateTagColorResponse>,
) => {
  const context = getContextFromReq(req);

  if (!context.permissions.canCreateAndUpdateTag()) {
    context.permissions.throwPermissionError();
  }

  const { tags, color } = req.body;

  await bulkUpdateTagColors(context.org.id, tags, color);

  res.status(200).json({
    status: 200,
  });
};

// region DELETE /tag/:id

type DeleteTagRequest = AuthRequest<{ id: string }, { id: string }>;

type DeleteTagResponse = {
  status: 200;
};

/**
 * DELETE /tag/
 * Delete one tag resource by ID
 * @param req
 * @param res
 */
export const deleteTag = async (
  req: DeleteTagRequest,
  res: Response<
    DeleteTagResponse | ApiErrorResponse,
    EventUserForResponseLocals
  >,
) => {
  const context = getContextFromReq(req);

  if (!context.permissions.canDeleteTag()) {
    context.permissions.throwPermissionError();
  }
  const { org } = context;
  const { id } = req.body;

  await removeTagFromExperiments({
    context,
    tag: id,
  });

  await removeTagInMetrics(org.id, id);

  await removeTagInFeature(context, id);

  await removeTagInAttribute(context, id);

  await removeTagFromSlackIntegration({ organizationId: org.id, tag: id });

  await removeTag(org.id, id);

  res.status(200).json({
    status: 200,
  });
};

// endregion DELETE /tag/:id
