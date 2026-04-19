import { setApiSession } from "@/utils/auth.js";
import { request } from "./http.js";
import { getWxCode } from "./wxCode.js";

export async function performWxLogin() {
  const code = await getWxCode();
  if (!code) throw new Error("未取得登录 code");
  const data = await request({
    url: "/auth/wx-login",
    method: "POST",
    data: { code }
  });
  setApiSession({ token: data.token, userId: data.userId });
  return data;
}
