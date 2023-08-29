const axios = require("axios").default;

class CampingApi {
  // the token for interactive with the API will be stored here.
  static token;

  static async request(endpoint, data = {}, method = "get") {
    const BASE_URL = process.env.DATABASE_URL || 'http://localhost:3001';

    console.debug('API Call:', endpoint, data, method);


    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const url = `${BASE_URL}/${endpoint}`;
    const headers = { authorization: `Bearer ${CampingApi.token}`};
    const params = method === 'get' ? data : {};

    console.log("URL", `${url}`);
    console.log("Data", data);
    console.debug("Params", params);
    console.log("Headers", headers);

    try {console.log("Trying...")
      return await axios({ url, method, data, params, headers });
    } catch (err) {
      console.error("API Error:", err.stack);

      let message = err.response.data.error.message;
      throw Array.isArray(message) ? message : [message];
    }
  }

  // Individual API routes

  /*Get a list of alerts */

  static async login(data) {
    console.log("Inside Login", data);
    let res = await this.request(`auth/token`, data, "post");
    return res  ;
  }

  static async register(data) {
    let res = await this.request(`auth/register`, data, "post");

    return res.data.token;
  }
  static async getCurrentUser(username) {
    console.log("Inside getCurrentUser", username);
    let res = await this.request(`users/${username}`);
    return res.data.user;
  }

  static async updateUserInfo(username, data) {
    let res = await this.request(`users/${username}`, data, "patch");
    return res;
  }
  static async addCamp(data){
    console.log("Inside add Camps", data);
    let res = await this.request(`camps`,data, 'post');
    return res;
  }
  static async reserve(user_id, camp_id) {
    console.log("Inside reserve camp function");
    console.log("User ID:", user_id, "Camp_ID:", camp_id)
    await this.request(`users/${user_id}/camps/${camp_id}`, {}, "post");
  }
  static async removeCampFromFavorites(user_id, camp_id){
    let res = await this.request(`users/${user_id}/camps/${camp_id}`, {user_id, camp_id}, 'post');
    return res;
  }
}

module.exports = CampingApi;