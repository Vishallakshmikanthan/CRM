import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

const customerSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  contact_person: z.string().min(2, "Contact person must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  industry: z.string().min(1, "Industry is required"),
  status: z.enum(["active", "inactive", "prospect"]),
  annual_revenue: z.number().optional(),
  employee_count: z.number().optional(),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void
  isLoading: boolean
  onClose: () => void
}

export function CustomerForm({ initialData, onSubmit, isLoading, onClose }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "USA",
      industry: "technology",
      status: "prospect",
      annual_revenue: undefined,
      employee_count: undefined,
      notes: "",
      ...initialData,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "USA",
        industry: "technology",
        status: "prospect",
        annual_revenue: undefined,
        employee_count: undefined,
        notes: "",
        ...initialData,
      })
    }
  }, [initialData, form])

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            {...form.register("company_name")}
            disabled={isLoading}
          />
          {form.formState.errors.company_name && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.company_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person *</Label>
          <Input
            id="contact_person"
            {...form.register("contact_person")}
            disabled={isLoading}
          />
          {form.formState.errors.contact_person && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.contact_person.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            disabled={isLoading}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            disabled={isLoading}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...form.register("address")}
            disabled={isLoading}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...form.register("city")}
            disabled={isLoading}
          />
          {form.formState.errors.city && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.city.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select
            value={form.watch("country")}
            onValueChange={form.setValue("country")}
            disabled={isLoading}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USA">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="France">France</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
              <SelectItem value="Japan">Japan</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.country && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.country.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select
            value={form.watch("industry")}
            onValueChange={form.setValue("industry")}
            disabled={isLoading}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.industry && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.industry.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={form.watch("status")}
            onValueChange={form.setValue("status")}
            disabled={isLoading}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="annual_revenue">Annual Revenue (USD)</Label>
          <Input
            id="annual_revenue"
            type="number"
            step="1000"
            min="0"
            {...form.register("annual_revenue", { valueAsNumber: true })}
            disabled={isLoading}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee_count">Employee Count</Label>
          <Input
            id="employee_count"
            type="number"
            min="1"
            {...form.register("employee_count", { valueAsNumber: true })}
            disabled={isLoading}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          disabled={isLoading}
          rows={3}
          placeholder="Additional notes about the customer..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  )
}