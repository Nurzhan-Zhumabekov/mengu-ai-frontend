import { httpClient } from './client'
import type { AuthTokens } from '@/types'

export interface RegisterPayload {
  org_name: string
  email: string
  password: string
  name: string
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthTokens> {
    const { data } = await httpClient.post<AuthTokens>('/auth/register', payload)
    return data
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await httpClient.post<AuthTokens>('/auth/login', { email, password })
    return data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await httpClient.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken })
    return data
  },

  async getGoogleOAuthUrl(): Promise<string> {
    const { data } = await httpClient.get<{ url: string }>('/auth/oauth/url')
    return data.url
  },

  async loginWithGoogleCode(code: string): Promise<AuthTokens> {
    const { data } = await httpClient.post<AuthTokens>('/auth/oauth/google', { code })
    return data
  },

  async loginWithMicrosoftCode(code: string): Promise<AuthTokens> {
    const { data } = await httpClient.post<AuthTokens>('/auth/oauth/microsoft', { code })
    return data
  },
}
