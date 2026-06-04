import uniqid from "uniqid";
import { FilterQuery } from "mongoose";
import { IdeaInterface } from "shared/types/idea";
import { IdeaDocument, IdeaModel } from "back-end/src/models/IdeasModel";
import { addTags } from "back-end/src/models/TagModel";

function withDefaultDeletedFilter(
  query: FilterQuery<IdeaDocument> = {},
): FilterQuery<IdeaDocument> {
  if (typeof query.deleted !== "undefined") {
    return query;
  }

  return {
    ...query,
    deleted: { $ne: true },
  };
}

export function getIdeasByOrganization(organization: string, project?: string) {
  const query: FilterQuery<IdeaDocument> = {
    organization,
  };

  if (project) {
    query.project = project;
  }

  return IdeaModel.find(withDefaultDeletedFilter(query));
}

export function getIdeasByQuery(query: FilterQuery<IdeaDocument>) {
  return IdeaModel.find(withDefaultDeletedFilter(query));
}

export async function createIdea(data: Partial<IdeaInterface>) {
  const idea = await IdeaModel.create({
    ...data,
    id: uniqid("idea_"),
    deleted: false,
    dateCreated: new Date(),
    dateUpdated: new Date(),
  });

  if (idea.tags) {
    await addTags(idea.organization, idea.tags);
  }

  return idea;
}

export function getIdeaById(id: string) {
  return IdeaModel.findOne(
    withDefaultDeletedFilter({
      id,
    }),
  );
}

export function getIdeasByIds(ids: string[]) {
  return IdeaModel.find(
    withDefaultDeletedFilter({
      id: { $in: ids },
    }),
  );
}

export function getIdeasByExperimentIds(ids: string[]) {
  const tmp: { experimentId: string }[] = [];
  ids.map((id) => {
    tmp.push({ experimentId: id });
  });
  return IdeaModel.find(
    withDefaultDeletedFilter({
      evidence: { $in: tmp },
    }),
  );
}

export function deleteIdeaById(id: string) {
  return IdeaModel.updateOne(
    {
      id,
      deleted: { $ne: true },
    },
    {
      $set: {
        deleted: true,
        dateUpdated: new Date(),
      },
    },
  );
}
