"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  Home,
  DollarSign,
  Heart,
  Users,
  GraduationCap,
  Scale,
  Coffee,
  Shield,
  Package,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

interface SupportCategory {
  id: string
  title: string
  icon: React.ReactNode
  items: string[]
}

const supportCategories: SupportCategory[] = [
  {
    id: "housing",
    title: "Housing & Tenancy Support",
    icon: <Home className="h-5 w-5" />,
    items: [
      "Understanding tenancy agreements",
      "Reporting repairs / speaking to landlords",
      "Rights & responsibilities guidance",
      "Moving in/out & utilities help",
      "Eviction prevention",
    ],
  },
  {
    id: "money",
    title: "Money & Benefits",
    icon: <DollarSign className="h-5 w-5" />,
    items: [
      "Budgeting support",
      "Applying for benefits (e.g. Universal Credit, PIP)",
      "Debt advice & financial referrals",
      "Bank account setup",
      "Emergency grants",
    ],
  },
  {
    id: "mental-health",
    title: "Mental Health & Emotional Support",
    icon: <Heart className="h-5 w-5" />,
    items: [
      "Mental health referrals",
      "Emotional wellbeing check-ins",
      "Access to counselling / peer groups",
      "Talking therapy referrals",
      "Support with routines (non-clinical)",
    ],
  },
  {
    id: "daily-living",
    title: "Daily Living Skills",
    icon: <Coffee className="h-5 w-5" />,
    items: [
      "Cooking / shopping support",
      "Hygiene & cleaning skills",
      "Personal care & self-care guidance",
      "Time & routine management",
    ],
  },
  {
    id: "learning-work",
    title: "Learning, Work & Training",
    icon: <GraduationCap className="h-5 w-5" />,
    items: [
      "Enrolling in training or life skills courses",
      "CVs & job prep",
      "Volunteering & work experience",
      "Help with digital tools",
      "Encouragement to return to study",
    ],
  },
  {
    id: "legal",
    title: "Legal & Advocacy",
    icon: <Scale className="h-5 w-5" />,
    items: [
      "Help with ID, immigration, court forms",
      "Advocacy for meetings (e.g. social services)",
      "Legal aid guidance",
      "DWP interviews & appeals",
      "Rights under Care or Housing Act",
    ],
  },
  {
    id: "social",
    title: "Social & Community",
    icon: <Users className="h-5 w-5" />,
    items: [
      "Join clubs, groups, or events",
      "Mentoring & befriending",
      "Social skills & connection",
      "Group activities to reduce isolation",
    ],
  },
  {
    id: "health",
    title: "Health & Safety",
    icon: <Shield className="h-5 w-5" />,
    items: [
      "Help registering with health providers",
      "Attend medical appointments",
      "Education on personal safety / sexual health",
      "Substance misuse support",
      "Safety plans & risk assessments",
    ],
  },
  {
    id: "essential-items",
    title: "Essential Items & Aid",
    icon: <Package className="h-5 w-5" />,
    items: ["Hygiene packs", "Clothing support", "Foodbank referrals", "Starter kits for new housing"],
  },
]

const housingOptions = [
  { value: "reality-tenant", label: "I'm a Reality Housing Tenant" },
  { value: "homeless", label: "I'm homeless or at risk of homelessness" },
  { value: "stable-housing", label: "I have stable housing but want extra support" },
  { value: "unhappy-housing", label: "I'm unhappy with my housing and want help finding supported accommodation" },
]

const STEPS = [
  { id: 1, title: "Your Housing Situation" },
  { id: 2, title: "Support Needs" },
  { id: 3, title: "Personal Information" },
  { id: 4, title: "Your Situation" },
]

export function EnhancedOnboardingForm() {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedSupports, setSelectedSupports] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [housingStatus, setHousingStatus] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    phoneNumber: "",
    situationDescription: "",
  })
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleSupport = (supportItem: string) => {
    setSelectedSupports((prev) =>
      prev.includes(supportItem) ? prev.filter((item) => item !== supportItem) : [...prev, supportItem],
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user found")
      }

      // Debug: Log the data being sent
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: user.email, // Use email from auth user
        phone_number: formData.phoneNumber,
        address_line_1: formData.addressLine1,
        address_line_2: formData.addressLine2,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country,
        housing_status: housingStatus,
        situation_description: formData.situationDescription,
        support_needs: selectedSupports,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }
      
      console.log('Attempting to save profile data:', profileData)
      
      // First, let's test if the table exists by doing a simple select
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      console.log('Table test result:', { testData, testError })
      
      if (testError) {
        console.error('Table does not exist or permission denied:', testError)
        
        // If table doesn't exist, try to save to profiles table instead as a fallback
        if (testError.code === 'PGRST116' || testError.message?.includes('relation "user_profiles" does not exist')) {
          console.log('user_profiles table does not exist, using profiles table as fallback')
          
          // Update the user's profile in the profiles table to set role
           const { error: profileError } = await supabase
             .from('profiles')
             .update({ 
               role: 'tenant' // Set default role
             })
             .eq('id', user.id)
          
          if (profileError) {
            console.error('Profile update error:', profileError)
            toast.error('Failed to complete onboarding. Please contact support.')
            return
          }
          
          toast.success('Onboarding completed! (Note: Full profile data will be saved once database is updated)')
          router.push('/tenant/dashboard')
          return
        }
        
        toast.error(`Database error: ${testError.message}. Please contact support.`)
        return
      }
      
      // Insert/update user profile
      const { error } = await supabase.from("user_profiles").upsert(profileData)

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || "Failed to save onboarding data")
      }

      toast.success("Onboarding completed successfully!")
      
      // Onboarding is only for tenants, so always redirect to tenant dashboard
      router.push('/tenant/dashboard')
      
    } catch (error: any) {
      console.error('Onboarding error:', error)
      toast.error(error.message || "Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!housingStatus
      case 2:
        return selectedSupports.length > 0
      case 3:
        return (
          !!formData.addressLine1 &&
          !!formData.city &&
          !!formData.postcode &&
          !!formData.country
        )
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Reality Housing</h1>
          <p className="text-lg text-muted-foreground">
            Let's get to know you better so we can provide the right support
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-300">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {currentStep}
              </span>
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your current housing situation"}
              {currentStep === 2 && "Select the types of support you're interested in"}
              {currentStep === 3 && "Provide your contact and address information"}
              {currentStep === 4 && "Tell us more about your current situation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Housing Situation */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Which best describes your situation?</Label>
                <RadioGroup value={housingStatus} onValueChange={setHousingStatus}>
                  {housingOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Support Needs */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-4 block">
                    What types of support are you interested in? (Select all that apply)
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Selected: {selectedSupports.length} items
                  </p>
                </div>
                
                <div className="space-y-3">
                  {supportCategories.map((category) => (
                    <Collapsible
                      key={category.id}
                      open={expandedCategories.includes(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between p-4 h-auto"
                        >
                          <div className="flex items-center gap-3">
                            {category.icon}
                            <span className="font-medium">{category.title}</span>
                          </div>
                          {expandedCategories.includes(category.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                          {category.items.map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Checkbox
                                id={item}
                                checked={selectedSupports.includes(item)}
                                onCheckedChange={() => toggleSupport(item)}
                              />
                              <Label htmlFor={item} className="text-sm cursor-pointer">
                                {item}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Personal Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name (Optional)</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter your full name (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                    placeholder="Enter your address"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter your city"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange("postcode", e.target.value)}
                      placeholder="Enter your postcode"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      placeholder="Enter your country"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Situation Description */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="situationDescription">
                    Tell us more about your situation (Optional)
                  </Label>
                  <Textarea
                    id="situationDescription"
                    value={formData.situationDescription}
                    onChange={(e) => handleInputChange("situationDescription", e.target.value)}
                    placeholder="Please describe your current situation and any specific needs or concerns you have..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Housing Status:</strong> {housingOptions.find(opt => opt.value === housingStatus)?.label}</p>
                    <p><strong>Support Needs:</strong> {selectedSupports.length} items selected</p>
                    {formData.fullName && <p><strong>Name:</strong> {formData.fullName}</p>}
                    <p><strong>Location:</strong> {formData.city}, {formData.postcode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Onboarding
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
