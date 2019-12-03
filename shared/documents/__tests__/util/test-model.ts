import {
  Doc,
  DocMap,
  withDocMapSpec,
  DocSpec,
  DocSchema,
  defineDocSpec
} from "../../src";

interface Post {
  title: string;
  text: string;
}

export function PostSpec(): DocSpec<Post> {
  return {
    namespace: "post",
    schema: {
      title: {
        required: true,
        validations: [
          (lib, title) =>
            lib.failIf(typeof title === "string", "Title must be text."),
          (lib, title) =>
            lib.failIf(title.length <= 100, "Title must be 100 characters max.")
        ]
      },
      text: {
        required: true,
        validations: [
          (lib, text) =>
            lib.failIf(typeof text === "string", "Contents must be text."),
          (lib, text) =>
            lib.failIf(
              text.length <= 512,
              "Contents must be 512 characters max."
            )
        ]
      }
    }
  };
}

interface PostComment {
  post: Doc<Post>;
}
export function PostCommentSpec() {
  const tag = {
    spec: PostSpec
  };

  const val = {
    spec: PostSpec
  };
  return withDocMapSpec<Post, Post>({ tag, val });
}

export function PostFeedSpec() {
  const tag = {
    validations: [(lib, tag) => lib.failIf(tag.length > 128, "Post Feed ")]
  };

  const val = {
    spec: PostSpec
  };

  return withDocMapSpec<Post, Post>();
}
