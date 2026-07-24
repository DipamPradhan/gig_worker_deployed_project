  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { accountsService } from "../../api";
  import { useApi } from "../../hooks";
  import {
    Card,
    Button,
    Input,
    Select,
    Loader,
    ErrorAlert,
    SuccessAlert,
    StatusBadge,
    EmptyState,
    ConfirmModal,
  } from "../../components/common";

  const UploadDocument = () => {
    const navigate = useNavigate();
    const { loading, error, execute, clearError } = useApi();
    const [documents, setDocuments] = useState([]);
    const [success, setSuccess] = useState("");
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [documentToDelete, setDocumentToDelete] = useState(null);

    useEffect(() => {
      fetchDocuments();
    }, []);

    // fetch prev uploaded document if exist
    const fetchDocuments = async () => {
      try {
        const data = await execute(() => accountsService.getWorkerDocuments());
        setDocuments(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        // Error handled by useApi
      }
    };

    // handle file state changes
    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    };

    // handling upload of document from form
    const handleSubmit = async (e) => {
      e.preventDefault();
      clearError();
      setSuccess("");

      if (!file || !documentType) {
        return;
      }

      try {
        const formData = new FormData();
        formData.append("document_file", file);
        formData.append("document_type", documentType);
        formData.append("document_number", documentNumber);

        await execute(() => accountsService.uploadDocument(formData));
        setSuccess("Document uploaded successfully! Pending admin verification.");
        setFile(null);
        setDocumentType("");
        setDocumentNumber("");
        // Reset file input
        document.getElementById("file-input").value = "";
        await fetchDocuments();
      } catch (err) {
        // Error handled by useApi
      }
    };

    // document remover handler function
    const handleDeleteDocument = async () => {
      if (!documentToDelete) {
        return;
      }

      clearError();
      setSuccess("");

      try {
        await execute(() =>
          accountsService.deleteWorkerDocument(documentToDelete.id),
        );
        setSuccess(
          "Document removed successfully. You can upload a new one now.",
        );
        setDocumentToDelete(null);
        setFile(null);
        setDocumentType("");
        setDocumentNumber("");
        const fileInput = document.getElementById("file-input");
        if (fileInput) {
          fileInput.value = "";
        }
        await fetchDocuments();
      } catch (err) {
        // Error handled by useApi
      }
    };

    // categories of document accepted
    const documentTypeOptions = [
      { value: "Citizenship", label: "Citizenship" },
      { value: "Driver's License", label: "Driver's License" },
      { value: "NIN Card", label: "NIN Card" },
    ];

    // boolean to check if any doc uploaded
    const hasUploadedDocument = documents.length > 0;

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Upload Documents
        </h1>

        {/* Upload Form */}
        <Card className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Upload New Document
          </h2>

          {hasUploadedDocument && (
            <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              You can upload only one document at a time. Remove the existing
              document below before uploading a new one.
            </div>
          )}

          <ErrorAlert message={error} onClose={clearError} />
          <SuccessAlert message={success} onClose={() => setSuccess("")} />

          <form onSubmit={handleSubmit}>
            <Select
              label="Document Type"
              name="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              options={documentTypeOptions}
              placeholder="Select document type"
              required
              disabled={hasUploadedDocument}
            />

            <div className="mb-4">
              <Input
                label="Document Number"
                name="document_number"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter document number"
                required
                disabled={hasUploadedDocument}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                File <span className="text-red-500">*</span>
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                disabled={hasUploadedDocument}
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG. Max size: 5MB
              </p>
            </div>

            {file && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  Selected file: <strong>{file.name}</strong> (
                  {(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={
                loading ||
                hasUploadedDocument ||
                !file ||
                !documentType ||
                !documentNumber
              }
            >
              Upload Document
            </Button>
          </form>
        </Card>

        {/* Existing Documents */}
        <Card title="Your Documents">
          {loading && documents.length === 0 ? (
            <Loader size="sm" />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents"
              message="You haven't uploaded any documents yet."
              icon="📄"
            />
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">📄</div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {doc.document_type || "Document"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={(
                        doc.verification_status || "Pending"
                      ).toUpperCase()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentToDelete(doc)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

  {/* to delete the document uploaded  */}
        <ConfirmModal
          isOpen={Boolean(documentToDelete)}
          title="Remove uploaded document?"
          message="This will delete your current uploaded document and enable the upload form again."
          confirmText="Remove"
          cancelText="Keep"
          variant="danger"
          onConfirm={handleDeleteDocument}
          onCancel={() => setDocumentToDelete(null)}
        />

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate("/worker/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  export default UploadDocument;
