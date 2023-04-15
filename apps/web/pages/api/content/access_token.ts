import { Submarine } from "pinata-submarine";
import { readContract } from "@wagmi/core";
import { lensBalusABI } from "contracts";
import { BigNumber } from "ethers";

const submarine = new Submarine(
  process.env.SUBMARINE_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
);

const post = async (req, res) => {
  const id = req.body.id;

  const announcement = await readContract({
    address: "0xb0B4e3E8Dd190478F2424AD241e3090877E736c7",
    abi: lensBalusABI,
    functionName: "announcements",
    args: [BigNumber.from(id)],
  });

  const info = await submarine.getSubmarinedContentByCid(announcement.infoCid)

  const url = "https://managed.mypinata.cloud/api/v1/auth/content/jwt";
  const headers = {
    "x-api-key": process.env.SUBMARINE_API_KEY,
    "Content-Type": "application/json",
  };

  const data = JSON.stringify({
    timeoutSeconds: 3600,
    contentIds: [info.items[0].id, info.items[0].metadata.contentId, info.items[0].metadata.imageId],
  });
  const params = { method: "POST", headers, body: data };
  const response = await fetch(url, params);
  const token = await response.json();

  res.status(201).json({
    accessToken: token
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
