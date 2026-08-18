package com.autocare.sparepartsservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "spare_parts")
public class SparePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "spare_part_compatible_models",
        joinColumns = @JoinColumn(name = "spare_part_id")
    )
    @Column(name = "compatible_model")
    private List<String> compatibleVehicleModels;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int stockQuantity;

    @Column(nullable = false)
    private String category;

    /** URL of the uploaded product image (if any). */
    private String imageUrl;

    private String tutorialVideoUrl;

    @Column(columnDefinition = "TEXT")
    private String installationSteps;

    /**
     * Whether AutoCare mechanics can be booked to install this part
     * ("Book a Mechanic" button visibility). Defaults to true.
     */
    @Column(nullable = false)
    private boolean mechanicInstallationAvailable = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public SparePart() {}

    public SparePart(String name, String description, List<String> compatibleVehicleModels,
                     BigDecimal price, int stockQuantity, String category) {
        this.name = name;
        this.description = description;
        this.compatibleVehicleModels = compatibleVehicleModels;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getCompatibleVehicleModels() {
        return compatibleVehicleModels;
    }

    public void setCompatibleVehicleModels(List<String> compatibleVehicleModels) {
        this.compatibleVehicleModels = compatibleVehicleModels;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTutorialVideoUrl() {
        return tutorialVideoUrl;
    }

    public void setTutorialVideoUrl(String tutorialVideoUrl) {
        this.tutorialVideoUrl = tutorialVideoUrl;
    }

    public String getInstallationSteps() {
        return installationSteps;
    }

    public void setInstallationSteps(String installationSteps) {
        this.installationSteps = installationSteps;
    }

    public boolean isMechanicInstallationAvailable() {
        return mechanicInstallationAvailable;
    }

    public void setMechanicInstallationAvailable(boolean mechanicInstallationAvailable) {
        this.mechanicInstallationAvailable = mechanicInstallationAvailable;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
