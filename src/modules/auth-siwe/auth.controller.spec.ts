import { Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

describe('Auth-SIWE', () => {
  async function generateSiweMessage(wallet_address: Address) {
    const getURL = new URL('http://localhost:3000/v1/auth/siweMessage');
    getURL.searchParams.set('wallet_address', wallet_address);

    const response = await fetch(getURL);

    return (await response.json()) as { message: string };
  }

  it.skip('Generate SIWE message', async function () {
    console.log(
      await generateSiweMessage('0x2B19dd6d68aD8b2Dc8c2343b6723422e2Eb9814D'),
    );
  });

  it('Login', async function () {
    const wallet_address = '0x2B19dd6d68aD8b2Dc8c2343b6723422e2Eb9814D';
    const private_key =
      '0x23eaf3d9ac2d8a081c38d19f93bcb19c8d2c87a6ff02c876b3a745cf9066a6a5';

    // generate SIWE message
    const { message } = await generateSiweMessage(wallet_address);

    // sign message
    const signature = await privateKeyToAccount(private_key).signMessage({
      message,
    });

    // login
    const response = await fetch('http://localhost:3000/v1/auth/login', {
      body: new URLSearchParams({
        signature,
        wallet_address,
      }),
      method: 'post',
    });

    console.log(await response.json());
  });
});
