import mongoose from "mongoose";
import { IdeaInterface } from "shared/types/idea";

const ideaSchema = new mongoose.Schema({
  id: String,
  text: String,
  archived: Boolean,
  deleted: {
    type: Boolean,
    default: false,
  },
  details: String,
  userId: String,
  userName: String,
  source: String,
  organization: String,
  project: String,
  tags: [String],
  votes: [
    {
      _id: false,
      userId: String,
      dir: Number,
      dateCreated: Date,
    },
  ],
  dateCreated: Date,
  dateUpdated: Date,
  impactScore: Number,
  experimentLength: Number,
  estimateParams: {
    segment: String,
    estimate: String,
    improvement: Number,
    numVariations: Number,
    userAdjustment: Number,
  },
});

ideaSchema.pre(/^find/, function () {
  const query = this.getFilter();

  if (typeof query.deleted === "undefined") {
    this.where({ deleted: { $ne: true } });
  }
});

export type IdeaDocument = mongoose.Document & IdeaInterface;

export const IdeaModel = mongoose.model<IdeaInterface>("Idea", ideaSchema);
