import { setTimeout } from 'timers/promises';
import { Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const BASE_URL = 'http://localhost:3000/v1/auth';

describe('Auth-SIWE', () => {
  async function generateSiweMessage(wallet_address: Address) {
    const getURL = new URL(`${BASE_URL}/siweMessage`);
    getURL.searchParams.set('wallet_address', wallet_address);

    const response = await fetch(getURL);

    return (await response.json()) as { message: string };
  }

  it.skip('Generate SIWE message', async function () {
    console.log(
      await generateSiweMessage('0x2B19dd6d68aD8b2Dc8c2343b6723422e2Eb9814D'),
    );
  });

  it('Login/Logout', async function () {
    const wallet_address = '0x2B19dd6d68aD8b2Dc8c2343b6723422e2Eb9814D';
    const private_key =
      '0x23eaf3d9ac2d8a081c38d19f93bcb19c8d2c87a6ff02c876b3a745cf9066a6a5';

    // generate SIWE message
    const { message } = await generateSiweMessage(wallet_address);

    // sign message
    const signature = await privateKeyToAccount(private_key).signMessage({
      message,
    });

    console.log('done sign');
    await setTimeout(2000);

    // login
    const login_resp = await fetch(`${BASE_URL}/login`, {
      body: new URLSearchParams({
        signature,
        wallet_address,
      }),
      method: 'post',
    });

    const login_payload = (await login_resp.json()) as {
      user: Record<string, any>;
      token: { expiresIn: `${number}`; accessToken: string };
    };

    const accessToken = login_payload.token.accessToken;
    console.log('accessToken:', accessToken);

    // wait for 2 seconds
    await setTimeout(2000);

    // logout
    const logout_resp = await fetch(`${BASE_URL}/logout`, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(await logout_resp.json());

    // wait for 3 seconds
    await setTimeout(3000);

    // re-logout  (should fail w/ UnauthorizedException)
    console.log(
      await (
        await fetch(`${BASE_URL}/logout`, {
          method: 'post',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      ).json(),
    );
  }, 100000);
});
