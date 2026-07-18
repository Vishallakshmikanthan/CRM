import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { DialogClose } from "@/components/ui/dialog"

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  direction: z.string().default("outbound"),
  status: z.string().default("draft"),
  from_email: z.string().email("Valid email required"),
  to_emails: z.array(z.string().email()).min(1, "At least one recipient required"),
  cc_emails: z.array(z.string().email()).optional(),
  bcc_emails: z.array(z.string().email()).optional(),
  related_type: z.string().optional(),
  related_id: z.string().optional(),
})

type EmailFormData = z.infer<typeof emailSchema>

interface EmailFormProps {
  initialData?: Partial<EmailFormData> | null
  onSubmit: (data: EmailFormData) => void
  isLoading?: boolean
  onClose: () => void
  readOnly?: boolean
}

export function EmailForm({ initialData, onSubmit, isLoading, onClose, readOnly = false }: EmailFormProps) {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      body: "",
      direction: "outbound",
      status: "draft",
      from_email: "",
      to_emails: [""],
      cc_emails: [""],
      bcc_emails: [""],
      related_type: "",
      related_id: "",
      ...initialData,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        subject: "",
        body: "",
        direction: "outbound",
        status: "draft",
        from_email: "",
        to_emails: [""],
        cc_emails: [""],
        bcc_emails: [""],
        related_type: "",
        related_id: "",
        ...initialData,
      })
    }
  }, [initialData, form])

  const handleSubmit = (data: EmailFormData) => {
    onSubmit(data)
  }

  const renderEmailArrayField = (name: string, label: string, placeholder: string) => {
    const { fields, append, remove } = form.useFieldArray({ name })
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder={placeholder}
                  {...form.register(`${name}.${index}`)}
                  disabled={readOnly}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={readOnly}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append("")}
              disabled={readOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add {label}
            </Button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *</FormLabel>
              <FormControl>
                <Input placeholder="Meeting follow-up" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body *</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="from_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="sender@company.com" {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {renderEmailArrayField("to_emails", "To *", "recipient@company.com")}
        {renderEmailArrayField("cc_emails", "CC", "cc@company.com")}
        {renderEmailArrayField("bcc_emails", "BCC", "bcc@company.com")}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="related_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related To (Type)</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="related_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related To (ID)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter related record ID" {...field} disabled={readOnly} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Email" : "Save Email"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}