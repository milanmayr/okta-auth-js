/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */

import assert from 'assert';
import TestApp from '../pageobjects/TestApp';
import { openPKCE } from '../util/appUtils';
import { loginRedirect } from '../util/loginUtils';
import { getIssuer, getBaseUrl } from '../util/browserUtils';

const proxyIssuer = getIssuer().replace(getBaseUrl(), 'http://localhost:8082');

describe('E2E through proxy', () => {
  beforeEach(async function bootstrap() {
    await openPKCE({
      issuer: proxyIssuer
    });
    await TestApp.issuer.then(el => el.getValue()).then(val => {
      assert(val.indexOf('http://localhost') === 0);
    });
    await loginRedirect('pkce');
  });

  afterEach(async function teardown() {
    if (await TestApp.isAuthenticated()) {
      await TestApp.logoutRedirect();
    }
  });

  it('can login and receive tokens', async () => {
    await TestApp.assertLoggedIn();
  });

  it('should end SSO session on logout', async () => {
    await TestApp.assertLoggedIn();

    // SSO session should exist
    await TestApp.getSessionInfo();
    await TestApp.assertSessionExists();
    
    // Logout
    await TestApp.logoutXHR();

    // SSO session should NOT exist
    await TestApp.getSessionInfo();
    await TestApp.assertSessionNotExists();
  });

  it('can renew all tokens (using refresh token)', async () => {
    if (!process.env.REFRESH_TOKEN) {
      return;
    }
    const prev = {
      idToken: await TestApp.idToken.then(el => el.getText()),
      accessToken: await TestApp.accessToken.then(el => el.getText())
    };
    await TestApp.renewTokens();
    await browser.waitUntil(async () => {
      const idToken = await TestApp.idToken.then(el => el.getText());
      const accessToken = await TestApp.accessToken.then(el => el.getText());
      return (
        idToken !== prev.idToken &&
        accessToken !== prev.accessToken
      );
    }, 10000);
    await TestApp.assertLoggedIn();
  });
  
  // TODO: is this possible?
  // eslint-disable-next-line jasmine/no-disabled-tests
  xit('can refresh all tokens using getWithoutPrompt', async () => {
    const prev = {
      idToken: await TestApp.idToken.then(el => el.getText()),
      accessToken: await TestApp.accessToken.then(el => el.getText())
    };
    await TestApp.getToken();
    await browser.waitUntil(async () => {
      const idToken = await TestApp.idToken.then(el => el.getText());
      const accessToken = await TestApp.accessToken.then(el => el.getText());
      return (
        idToken !== prev.idToken &&
        accessToken !== prev.accessToken
      );
    }, 10000);
    await TestApp.assertLoggedIn();
  });

});