import { Submarine } from "pinata-submarine";
import { readContract } from "@wagmi/core";
import { lensBalusABI } from "contracts";
import { BigNumber } from "ethers";

const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL,
);

const post = async (req, res) => {
  const id = req.body.id;

  const announcement = await readContract({
    address: "0xb0B4e3E8Dd190478F2424AD241e3090877E736c7",
    abi: lensBalusABI,
    functionName: "announcements",
    args: [BigNumber.from(id)],
  });

  const info = await submarine.getSubmarinedContentByCid(announcement.infoCid);

  const unlockableFileIds = [info.items[0].id, info.items[0].metadata.contentId, info.items[0].metadata.imageId]

  await Promise.all(
    unlockableFileIds.map(async (fileId) => submarine.makeFilePublic(fileId))
  )

  return res.status(201).send("");
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
