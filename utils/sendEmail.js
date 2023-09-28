import ElasticEmail from "@elasticemail/elasticemail-client";
import "dotenv/config";

const { ELASTICEMAIL_FROM, ELASTICEMAIL_API_KEY, BASE_URL } = process.env;

const defaultClient = ElasticEmail.ApiClient.instance;

const { apikey } = defaultClient.authentications;
apikey.apiKey = ELASTICEMAIL_API_KEY;

const api = new ElasticEmail.EmailsApi();

const massageVeryfyEmail = (key) =>
  `<div style="
    background: yellow;
    padding: 20px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Ukraine.svg/1280px-Flag_of_Ukraine.svg.png" height="70" width="100">
  <a target="_blank" href="${BASE_URL}/api/auth/users/verify/${key}" 
  style="
  padding: 10px;
    color: black;
    background: #0000ff4f;
    border-radius: 20px;
    margin: 20px;
    text-decoration: none;
    font-weight: 600;
  ">➡️ Click to verify email ⬅️</a>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Coat_of_Arms_of_Ukraine.svg/800px-Coat_of_Arms_of_Ukraine.svg.png" height="70" width="50">
</div>
  `;

const sendEmail = async (mail, key) => {
  const email = ElasticEmail.EmailMessageData.constructFromObject({
    Recipients: [new ElasticEmail.EmailRecipient(mail)],
    Content: {
      Body: [
        ElasticEmail.BodyPart.constructFromObject({
          ContentType: "HTML",
          Content: massageVeryfyEmail(key),
        }),
      ],
      Subject: "Verify email",
      From: ELASTICEMAIL_FROM,
    },
  });
  const callback = function (error, data, response) {
    if (error) {
      console.error(error);
    } else {
      console.log("API called successfully.");
    }
  };

  api.emailsPost(email, callback);
};

export default sendEmail;
