"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/label"

interface FormData {
  label: string
  apiKey: string
  secretKey: string
}

export function ApiKeyForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    label: '',
    apiKey: '',
    secretKey: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Log form state
      console.log('Form state before submission:', formData)

      // Validate form data
      if (!formData.label || !formData.apiKey || !formData.secretKey) {
        const missing = [];
        if (!formData.label) missing.push('name');
        if (!formData.apiKey) missing.push('Binance API key');
        if (!formData.secretKey) missing.push('Binance secret');
        
        const errorMessage = `Missing required fields: ${missing.join(', ')}`;
        console.log('Validation error:', errorMessage);
        throw new Error(errorMessage);
      }

      const payload = JSON.stringify(formData);
      console.log('Request payload:', payload);

      const response = await fetch('/api/binance-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || data.details || 'Failed to add API key');
      }

      // Reset form and reload page on success
      setFormData({
        label: '',
        apiKey: '',
        secretKey: '',
      });
      window.location.reload();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add API key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="label">Key Name</Label>
        <Input
          id="label"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="Main Account"
          required
          minLength={1}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiKey">Binance API Key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          value={formData.apiKey}
          onChange={handleChange}
          type="text"
          placeholder="Your Binance API Key"
          required
          minLength={1}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secretKey">Binance Secret</Label>
        <Input
          id="secretKey"
          name="secretKey"
          value={formData.secretKey}
          onChange={handleChange}
          type="text"
          placeholder="Your Binance Secret"
          required
          minLength={1}
          autoComplete="off"
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <Button type="submit" disabled={loading} variant="green">
        {loading ? 'Adding...' : 'Add API Key'}
      </Button>
    </form>
  )
} 