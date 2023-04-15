import { v4 } from "uuid";
import {
  isRelayerResult,
  PublicationMainFocus,
  PublicationMetadataDisplayTypes,
} from "@lens-protocol/client";
import formidable from "formidable";
import { Submarine } from "pinata-submarine";
import mime from "mime-types";

const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
);

export const config = {
  api: {
    bodyParser: false,
  },
};

const post = async (req, res) => {
  const form = formidable({ multiples: true });
  form.parse(req, async function (err, fields, files) {
    const description = fields.description;
    const message = fields.message;
    const image = files.image;

    const id = v4();

    const imageExtension = mime.extension(image.mimetype);
    const imageFileName = `image.${imageExtension}`;
    const imageRes = await submarine.uploadFileOrFolder(
      image.filepath,
      imageFileName
    );
    const imageCid = imageRes.items[0].cid;
    const postContent = {
      version: "2.0.0",
      metadata_id: id,
      name: "balus publication",
      description: "balus publication",
      mainContentFocus: PublicationMainFocus.Image,
      content: message,
      media: [
        {
          item: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${imageCid}`,
          type: image.mimetype,
        },
      ],
      locale: "en-US",
      attributes: [
        {
          displayType: PublicationMetadataDisplayTypes.String,
          traitType: "Created with",
          value: "balus",
        },
      ],
      tags: ["balus"],
      appId: "balus",
    };

    const postContentRes = await submarine.uploadJson(postContent, "postContent.json")

    const descriptionJson = {
      id,
      description,
    };
    const descriptionRes = await submarine.uploadJson(descriptionJson, "description.json", undefined, {
      imageId: imageRes.items[0].id,
      contentId: postContentRes.item.id,
    })

    const response = {
      descriptionCid: descriptionRes.item.cid,
      postContentCid: postContentRes.item.cid,
    };

    return res.status(201).json(response);
  });
};

export default (req, res) => {
  const { method } = req;

  switch (method) {
    case "POST":
      post(req, res);
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
