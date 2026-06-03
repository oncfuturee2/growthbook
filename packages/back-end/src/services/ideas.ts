import uniqid from "uniqid";
import { FilterQuery } from "mongoose";
import { IdeaInterface } from "shared/types/idea";
import { IdeaDocument, IdeaModel } from "back-end/src/models/IdeasModel";
import { addTags } from "back-end/src/models/TagModel";

export function getIdeasByOrganization(organization: string, project?: string) {
  const query: FilterQuery<IdeaDocument> = {
    organization,
    deleted: { $ne: true },
  };

  if (project) {
    query.project = project;
  }

  return IdeaModel.find(query);
}

export function getIdeasByQuery(query: FilterQuery<IdeaDocument>) {
  return IdeaModel.find({
    ...query,
    deleted: { $ne: true },
  });
}

export async function createIdea(data: Partial<IdeaInterface>) {
  const idea = await IdeaModel.create({
    // Default values that can be overridden
    deleted: false,
    // The data object passed in
    ...data,
    // Values that cannot be overridden
    id: uniqid("idea_"),
    dateCreated: new Date(),
    dateUpdated: new Date(),
  });

  if (idea.tags) {
    await addTags(idea.organization, idea.tags);
  }

  return idea;
}

export function getIdeaById(id: string) {
  return IdeaModel.findOne({
    id,
    deleted: { $ne: true },
  });
}

export function getIdeasByIds(ids: string[]) {
  return IdeaModel.find({
    id: { $in: ids },
    deleted: { $ne: true },
  });
}

export function getIdeasByExperimentIds(ids: string[]) {
  const tmp: { experimentId: string }[] = [];
  ids.map((id) => {
    tmp.push({ experimentId: id });
  });
  return IdeaModel.find({
    evidence: { $in: tmp },
    deleted: { $ne: true },
  });
}

export async function deleteIdeaById(id: string) {
  return IdeaModel.updateOne(
    { id },
    {
      deleted: true,
      dateUpdated: new Date(),
    }
  );
}
